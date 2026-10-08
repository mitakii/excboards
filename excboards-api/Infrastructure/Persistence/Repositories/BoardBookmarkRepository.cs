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

    public async Task<CursorPage<BookmarkedBoardDto>> GetBookmarkedBoardsPagedAsync(Guid userId, TimeCursor? cursor, int pageSize)
    {
        var query = context.BoardBookmarks
            .Where(bm => bm.UserId == userId
                         && (bm.Board.IsPublished
                             || bm.Board.UserId == userId
                             || bm.Board.Collaborators.Any(c => c.UserId == userId)));

        int? total = cursor is null ? await query.CountAsync() : null;

        if (cursor is { } c)
            query = query.Where(bm => EF.Functions.LessThan(
                ValueTuple.Create(bm.CreatedAt, bm.Id), ValueTuple.Create(c.At, c.Id)));

        // The bookmark's own Id is the tie-breaker, so carry it alongside the DTO.
        var rows = await query
            .AsNoTracking()
            .OrderByDescending(bm => bm.CreatedAt)
            .ThenByDescending(bm => bm.Id)
            .Take(pageSize + 1)
            .Select(bm => new { bm.Id, Dto = new BookmarkedBoardDto()
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
            } })
            .ToListAsync();

        var page = CursorPaging.Build(rows, pageSize, total,
            r => new TimeCursor(r.Dto.BookmarkedAt, r.Id).ToString());
        return new CursorPage<BookmarkedBoardDto>
        {
            Data = page.Data.Select(r => r.Dto).ToList(),
            NextCursor = page.NextCursor,
            Total = page.Total,
        };
    }
}