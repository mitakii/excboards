using Application.Interfaces;
using Domain.Dto;
using Domain.Interfaces;
using ErrorOr;

namespace Application.Bookmarks;

public class BookmarkService(IBoardBookmarkRepository bookmarkRepository, IPermissionService permissionService)
{
    public async Task<ErrorOr<CursorPage<BookmarkedBoardDto>>> GetBookmarkedBoardsPagedAsync(Guid userId, TimeCursor? cursor,
        int pageSize)
    {
        return await bookmarkRepository.GetBookmarkedBoardsPagedAsync(userId, cursor, pageSize);
    }

    public async Task<ErrorOr<Success>> AddBookmarkAsync(Guid userId, Guid boardId)
    {
        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        await bookmarkRepository.AddBookmarkAsync(userId, boardId);
        return Result.Success;
    }
    
    public async Task<ErrorOr<Deleted>> RemoveBookmarkAsync(Guid userId, Guid boardId)
    {
        await bookmarkRepository.RemoveBookmarkAsync(userId, boardId);
        return Result.Deleted;
    }
}