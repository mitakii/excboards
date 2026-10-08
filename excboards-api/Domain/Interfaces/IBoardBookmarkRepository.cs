using Domain.Dto;

namespace Domain.Interfaces;

public interface IBoardBookmarkRepository
{
    // false when the bookmark already existed
    public Task<bool> AddBookmarkAsync(Guid userId, Guid boardId);
    public Task RemoveBookmarkAsync(Guid userId, Guid boardId);
    public Task<CursorPage<BookmarkedBoardDto>> GetBookmarkedBoardsPagedAsync(Guid userId, TimeCursor? cursor, int pageSize);
}