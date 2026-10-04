using Application.Bookmarks;
using Domain.Dto;
using excboards_api.Contracts;
using excboards_api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookmarksController(BookmarkService bookmarkService) : ControllerBase
{
    private const int MaxPageSize = 50;

    [HttpGet]
    public async Task<IActionResult> GetBookmarkedBoards([FromQuery] PagedRequest request)
    {
        var page = Math.Max(request.Page, 1);
        var pageSize = Math.Clamp(request.PageSize, 1, MaxPageSize);

        var result = await bookmarkService.GetBookmarkedBoardsPagedAsync(User.GetUserId(), page, pageSize);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(new PagedResponse<BookmarkedBoardDto>(
            result.Value.Data,
            result.Value.Total,
            result.Value.Page,
            result.Value.PageSize));
    }
    
    [HttpPut("{boardId:guid}")]
    public async Task<IActionResult> AddBookmark(Guid boardId)
    {
        var result = await bookmarkService.AddBookmarkAsync(User.GetUserId(), boardId);
        if (result.IsError)
            return result.ToProblem(this);

        return NoContent();
    }
    
    [HttpDelete("{boardId:guid}")]
    public async Task<IActionResult> RemoveBookmark(Guid boardId)
    {
        var result = await bookmarkService.RemoveBookmarkAsync(User.GetUserId(), boardId);
        if (result.IsError)
            return result.ToProblem(this);

        return NoContent();
    }
}
