using Application.Boards;
using excboards_api.Contracts.Boards;
using excboards_api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Infrastructure.Persistence.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ThumbnailController(BoardThumbnailService thumbnailService) : ControllerBase
{
    [Authorize]
    [HttpPost("{boardId:guid}")]
    public async Task<IActionResult> AddBoardThumbnailAsync(Guid boardId)
    {
        var result = await thumbnailService.AddBoardThumbnailAsync(User.GetUserId(), boardId);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    [AllowAnonymous]
    [HttpGet("{boardId:guid}")]
    public async Task<IActionResult> GetBoardThumbnailsAsync(Guid boardId)
    {
        var result = await thumbnailService.GetBoardThumbnailsAsync(User.TryGetUserId(), boardId);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    // one request for every card on a board list page
    [AllowAnonymous]
    [HttpPost("batch")]
    public async Task<IActionResult> GetThumbnailsForBoardsAsync(BoardThumbnailsBatchRequest request)
    {
        var result = await thumbnailService.GetThumbnailsForBoardsAsync(User.TryGetUserId(), request.BoardIds);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    [AllowAnonymous]
    [HttpGet("{boardId:guid}/{position:int}")]
    public async Task<IActionResult> GetBoardThumbnailAsync(Guid boardId, int position)
    {
        var result = await thumbnailService
            .GetBoardThumbnailAsync(User.TryGetUserId(), boardId, position);
        
        if (result.IsError)
            return result.ToProblem(this);
        return Ok(result.Value);
    }

    [Authorize]
    [HttpDelete("{boardId:guid}/{position:int}")]
    public async Task<IActionResult> RemoveBoardThumbnailAsync(Guid boardId, int position)
    {
        var result = await thumbnailService
            .DeleteBoardThumbnailAsync(User.GetUserId(), boardId, position);
        
        if (result.IsError)
            return result.ToProblem(this);
        return Ok(result.Value);
    }
}