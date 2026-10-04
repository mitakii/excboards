using Application.Likes;
using excboards_api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LikesController(LikeService likeService) : ControllerBase
{
    // idempotent: liking an already liked board is a no-op
    [HttpPut("{boardId:guid}")]
    public async Task<IActionResult> Like(Guid boardId)
    {
        var result = await likeService.LikeAsync(User.GetUserId(), boardId);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    [HttpDelete("{boardId:guid}")]
    public async Task<IActionResult> Unlike(Guid boardId)
    {
        var result = await likeService.UnlikeAsync(User.GetUserId(), boardId);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }
}
