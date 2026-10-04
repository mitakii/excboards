using Domain.Dto;

namespace Domain.Interfaces;

public interface IBoardBookmarkRepository
{
    // false when the bookmark already existed
    public Task<bool> AddBookmarkAsync(Guid userId, Guid boardId);
    public Task RemoveBookmarkAsync(Guid userId, Guid boardId);
    public Task<PagedResult<BookmarkedBoardDto>> GetBookmarkedBoardsPagedAsync(Guid userId, int pageNumber,
        int pageSize);
}