using Application.Interfaces;
using Application.Storage;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Storage;

public class DeletedBoardsCleanupJob(
    AppDbContext db,
    IFileRepository fileRepository,
    IBoardRepository boardRepository,
    IOptions<BoardDeletionOptions> options,
    ILogger<DeletedBoardsCleanupJob> logger)
{
    public async Task RunAsync(CancellationToken cancellationToken)
    {
        var gracePeriod = DateTime.UtcNow.AddDays(-options.Value.GracePeriodDays);

        var deletedBoards = await db.UserBoards
            .IgnoreQueryFilters()
            .Where(b => b.DeletedAt != null && b.DeletedAt < gracePeriod)
            .ToListAsync(cancellationToken);
        if (deletedBoards.Count == 0)
            return;

        var purgedBoards = new List<UserBoard>();
        var totalDeletedFiles = 0;

        foreach (var board in deletedBoards)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                totalDeletedFiles += await CleanupBoardStorageAsync(board.Id);
                purgedBoards.Add(board);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex,
                    "Deleted-board cleanup failed for board {BoardId}; will retry next run", board.Id);
            }
        }

        if (purgedBoards.Count > 0) 
        {
            await boardRepository.DeleteAsync(purgedBoards);
            logger.LogInformation("Purged {PurgedCount} of {TotalCount} deleted boards",
                purgedBoards.Count, deletedBoards.Count);
        }

        if (totalDeletedFiles > 0)
            logger.LogInformation("Deleted {TotalDeletedFiles} files across {BoardCount} boards",
                totalDeletedFiles, purgedBoards.Count);
    }

    private async Task<int> CleanupBoardStorageAsync(Guid boardId)
    {
        await fileRepository.DeleteFileAsync(BoardFileKeys.Scene(boardId));

        var stored = await fileRepository.ListObjectsAsync(BoardFileKeys.FilesPrefix(boardId));
        if (stored.Count == 0)
            return 0;

        await fileRepository.DeleteFilesAsync(stored.Select(o => o.Key).ToList());
        return stored.Count;
    }
}
