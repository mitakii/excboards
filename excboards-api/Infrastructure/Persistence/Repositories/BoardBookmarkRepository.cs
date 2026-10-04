using Domain.Dto;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Infrastructure.Persistence.Repositories;

public class BoardBookmarkRepository(AppDbContext context) : IBoardBookmarkRepository
{
    public async Task<bool> AddBookmarkAsync(Guid userId, Guid boardId)
    {
        if (await context.BoardBookmarks.AnyAsync(b => b.UserId == userId && b.BoardId == boardId))
            return false;

        context.BoardBookmarks.Add(new BoardBookmark
        {
            UserId = userId,
            BoardId = boardId,
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

    public Task RemoveBookmarkAsync(Guid userId, Guid boardId)
    {
        return context.BoardBookmarks
            .Where(b => b.UserId == userId && b.BoardId == boardId)
            .ExecuteDeleteAsync();
    }

    public async Task<PagedResult<BookmarkedBoardDto>> GetBookmarkedBoardsPagedAsync(Guid userId, int pageNumber, int pageSize)
    {
        var query = context.BoardBookmarks
            .Where(bm => bm.UserId == userId
                         && (bm.Board.IsPublished
                             || bm.Board.UserId == userId
                             || bm.Board.Collaborators.Any(c => c.UserId == userId)));

        var total = await query.CountAsync();

        var items = await query
            .AsNoTracking()
            .OrderByDescending(bm => bm.CreatedAt)
            .ThenByDescending(bm => bm.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(bm => new BookmarkedBoardDto()
            {
                Name = bm.Board.Name,
                Description = bm.Board.Description,
                IsPublished = bm.Board.IsPublished,
                CreatedAt = bm.Board.Created,
                OwnerId = bm.Board.UserId,
                UpdatedAt = bm.Board.Updated,
                BoardId = bm.Board.Id,
                BookmarkedAt = bm.CreatedAt,
                LikesCount = bm.Board.BoardLikes.Count,
                IsLiked = bm.Board.BoardLikes.Any(l => l.UserId == userId),
                Tags = bm.Board.Tags.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList()
            })
            .ToListAsync();

        return new PagedResult<BookmarkedBoardDto>()
        {
            Data = items,
            Total = total,
            Page = pageNumber,
            PageSize = pageSize
        };
    }
}