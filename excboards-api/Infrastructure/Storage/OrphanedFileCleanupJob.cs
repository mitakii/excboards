using System.Net;
using Amazon.S3;
using Application.Interfaces;
using Application.Storage;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Storage;

public class OrphanedFileCleanupJob(
    AppDbContext db, 
    IFileRepository fileRepository, 
    IOptions<FileCleanupOptions> options, 
    ILogger<OrphanedFileCleanupJob> logger)
{
    public async Task RunAsync(CancellationToken stoppingToken)
    {
        var boardIds = await db.UserBoards.Select(b => b.Id).ToListAsync(cancellationToken: stoppingToken);

        int totalDeletedFiles = 0;
        foreach (var boardId in boardIds)
        {
            stoppingToken.ThrowIfCancellationRequested();
            try
            {
                totalDeletedFiles += await BoardCleanupAsync(boardId, stoppingToken);
            }
            catch (Exception e)
            {
                logger.LogWarning(e, "Orphaned file cleanup job failed for {BoardId}", boardId);
            }
        }
        
        if (totalDeletedFiles > 0)
            logger.LogInformation("Orphaned file cleanup job completed with {TotalDeletedFiles} orphaned files", totalDeletedFiles);
    }

    private async Task<int> BoardCleanupAsync(Guid boardId, CancellationToken stoppingToken)
    {
        HashSet<string> referencedIds;
        try
        {
            await using var scene = await fileRepository.GetFileAsync(BoardFileKeys.Scene(boardId));
            referencedIds = await SceneJsonFileParser.GetReferencedFileIdsAsync(scene);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return 0;
        }
        
        var referencedKeys = referencedIds
            .Select(id => BoardFileKeys.File(boardId, id))
            .ToHashSet(StringComparer.Ordinal);

        var storedFiles = await fileRepository.ListObjectsAsync(BoardFileKeys.FilesPrefix(boardId));
        var cutoff = DateTime.UtcNow.AddHours(-options.Value.MinFileAgeHours);
        
        var orphaned = storedFiles
            .Where(o => o.LastModified < cutoff && !referencedKeys.Contains(o.Key))
            .Select(o => o.Key)
            .ToHashSet(StringComparer.Ordinal);

        if (orphaned.Count == 0)
            return 0;

        await fileRepository.DeleteFilesAsync(orphaned);
        logger.LogInformation("Deleted {OrphanedCount} orphaned files in {BoardId} board", orphaned.Count, boardId);
        return orphaned.Count;
    }
}