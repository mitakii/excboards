using Domain.Entities;
using Domain.Exceptions;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ThumbnailRepository(AppDbContext context) : IThumbnailRepository
{
    public Task<BoardThumbnail?> GetBoardThumbnailAsync(Guid boardId, int position)
    {
        return context.BoardThumbnails
            .Where(t => t.BoardId == boardId && t.Position == position)
            .FirstOrDefaultAsync();
    }

    public Task<List<BoardThumbnail>> GetBoardThumbnailsAsync(Guid boardId)
    {
        return context.BoardThumbnails
            .Where(t => t.BoardId == boardId)
            .ToListAsync();
    }

    public async Task<BoardThumbnail> AddNextBoardThumbnailAsync(Guid boardId, int maxThumbnails)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();

        // blocks concurrent adds for this board so the count below cant race with other requests
        await context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT pg_advisory_xact_lock(hashtext({boardId.ToString()})::bigint)");

        var count = await context.BoardThumbnails.Where(t => t.BoardId == boardId).CountAsync();
        if (count >= maxThumbnails)
            throw new TooManyThumbnailsException(boardId, maxThumbnails);

        var thumbnail = new BoardThumbnail
        {
            Id = Guid.NewGuid(),
            BoardId = boardId,
            Position = count + 1,
            Created = DateTime.UtcNow,
        };

        context.BoardThumbnails.Add(thumbnail);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();

        return thumbnail;
    }

    public async Task DeleteBoardThumbnailAsync(BoardThumbnail thumbnail)
    {
        context.BoardThumbnails.Remove(thumbnail);
        await context.SaveChangesAsync();
    }

    public Task<int> GetThumbnailsCount(Guid boardId)
    {
        return context.BoardThumbnails.Where(t => t.BoardId == boardId)
            .CountAsync();
    }
}