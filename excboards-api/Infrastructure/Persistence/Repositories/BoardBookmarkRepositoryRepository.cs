using Domain.Dto;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class BoardBookmarkRepository(AppDbContext context) : IBoardBookmark
{
    public async Task<BoardBookmark> AddBookmarkAsync(Guid userId, Guid boardId)
    {
        var bookmark = new BoardBookmark
        {
            UserId = userId,
            BoardId = boardId,
            CreatedAt = DateTime.UtcNow
        };
        
        context.BoardBookmarks.Add(bookmark);
        await context.SaveChangesAsync();
        return bookmark;
    }

    public async Task RemoveBookmarkAsync(Guid userId, Guid boardId)
    {
        var bookmark = await context.BoardBookmarks
            .FirstOrDefaultAsync(b => b.UserId == userId && b.BoardId == boardId);
        if (bookmark == null)
            return;
        
        context.BoardBookmarks.Remove(bookmark);
        await context.SaveChangesAsync();
    }

    public async Task<PagedResult<BoardBookmark>> GetUserBookmarksPagedAsync(Guid userId, int pageNumber, int pageSize)
    {
        var data = context.BoardBookmarks
            .AsNoTracking()
            .OrderByDescending(bb => bb.CreatedAt)
            .Where(bb => bb.UserId == userId);
        
        var totalCount = data.Count();
        
        var bookmarks = await data.Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<BoardBookmark>()
        {
            Data = bookmarks,
            Total = totalCount,
            Page = pageNumber,
            PageSize = pageSize
        };
    }
}