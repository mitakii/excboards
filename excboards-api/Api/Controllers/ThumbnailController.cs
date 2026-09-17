using Application.Boards;
using excboards_api.Extensions;
using Infrastructure.Persistence.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ThumbnailController(BoardThumbnailService thumbnailService) : ControllerBase
{
    [HttpPost("{boardId:guid}")]
    public async Task<IActionResult> AddBoardThumbnailAsync(Guid boardId)
    {
        var result = await thumbnailService.AddBoardThumbnailAsync(User.GetUserId(), boardId);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    [HttpGet("{boardId:guid}/{position:int}")]
    public async Task<IActionResult> GetBoardThumbnailAsync(Guid boardId, int position)
    {
        var result = await thumbnailService
            .GetBoardThumbnailAsync(User.GetUserId(), boardId, position);
        
        if (result.IsError)
            return result.ToProblem(this);
        return Ok(result.Value);
    }

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