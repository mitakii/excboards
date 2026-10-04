using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Infrastructure.Persistence.Repositories;

public class BoardLikeRepository(AppDbContext context) : ILikeRepository
{
    public Task<int> GetBoardLikesAsync(Guid boardId)
    {
        return context.BoardLikes.CountAsync(l => l.BoardId == boardId);
    }

    public Task<bool> IsLikedAsync(Guid boardId, Guid userId)
    {
        return context.BoardLikes.AnyAsync(l => l.BoardId == boardId && l.UserId == userId);
    }

    public async Task<bool> LikeBoardAsync(Guid boardId, Guid userId)
    {
        if (await IsLikedAsync(boardId, userId))
            return false;

        context.BoardLikes.Add(new BoardLike
        {
            BoardId = boardId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        try
        {
            await context.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // a concurrent request created it first
            return false;
        }
    }

    public Task UnlikeBoardAsync(Guid boardId, Guid userId)
    {
        return context.BoardLikes
            .Where(l => l.BoardId == boardId && l.UserId == userId)
            .ExecuteDeleteAsync();
    }
}
