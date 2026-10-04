using Application.Dto;
using Application.WorldBoards;
using excboards_api.Contracts;
using excboards_api.Contracts.Boards;
using excboards_api.Contracts.Search;
using excboards_api.Extensions;
using excboards_api.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorldBoardController(
    WorldBoardService worldBoardService,
    ILogger<WorldBoardController> logger,
    IHubContext<CanvasHub> hubContext) : ControllerBase
{
    private const int MaxPageSize = 50;

    // No role is issued yet, so these stay closed until an admin role exists.
    [Authorize(Roles = "Admin")]
    [HttpPost("create")]
    public async Task<IActionResult> Create(IFormFile scene)
    {
        await using var stream = scene.OpenReadStream();

        var result = await worldBoardService
            .CreateAsync(stream);
        if (result.IsError)
            return result.ToProblem(this);

        return Created($"/api/worldboard/{result.Value}", result.Value);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{boardId:guid}")]
    public async Task<IActionResult> Delete(Guid boardId)
    {
        var result = await worldBoardService.DeleteAsync(boardId);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok();
    }

    [AllowAnonymous]
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrent()
    {
        var result = await worldBoardService.GetOrCreateCurrentAsync();
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    // previous months' boards, newest first
    [AllowAnonymous]
    [HttpGet("archive")]
    public async Task<IActionResult> GetArchive([FromQuery] PagedRequest request)
    {
        var page = Math.Max(request.Page, 1);
        var pageSize = Math.Clamp(request.PageSize, 1, MaxPageSize);

        var result = await worldBoardService.GetArchivedPagedAsync(page, pageSize);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(new PagedResponse<WorldBoardDto>(
            result.Value.Data,
            result.Value.Total,
            result.Value.Page,
            result.Value.PageSize));
    }

    [AllowAnonymous]
    [HttpGet("{boardId:guid}")]
    public async Task<IActionResult> GetById(Guid boardId)
    {
        var result = await worldBoardService.GetByIdAsync(boardId);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    // get scene(excalidraw) file
    [AllowAnonymous]
    [HttpGet("{boardId:guid}/scene")]
    public async Task<IActionResult> GetScene(Guid boardId)
    {
        var result = await worldBoardService.GetSceneAsync(boardId);
        if (result.IsError)
            return result.ToProblem(this);

        return File(result.Value, "application/json");
    }

    // save scene to file storage
    [HttpPut("{boardId:guid}/scene")]
    public async Task<IActionResult> SaveScene(Guid boardId, [FromForm] SaveSceneRequest request)
    {
        await using var stream = request.Scene.OpenReadStream();

        var result = await worldBoardService.SaveSceneAsync(User.GetUserId(), boardId, request.SceneHash, stream);
        if (result.IsError)
            return result.ToProblem(this);

        if (result.Value is { } hash)
        {
            try
            {
                await hubContext.Clients.Group(boardId.ToString())
                    .SendAsync("SceneSaved", hash, request.Kind.ToString());
            }
            catch (Exception e)
            {
                logger.LogWarning(e, "Scene saved but notify failed for board {boardId}", boardId);
            }
        }

        return Ok();
    }

    // get presigned links upload/download
    [AllowAnonymous]
    [HttpPost("{boardId:guid}/downloadUrls")]
    public async Task<IActionResult> GetFilePresignedUrls(Guid boardId, [FromBody] BoardPresignedUrlsRequest request)
    {
        if(request.FileIds is null or {Count: 0})
            return BadRequest();

        var result = await worldBoardService
            .GetDownloadPresignedUrls(boardId, request.FileIds);
        if(result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    [HttpGet("{boardId:guid}/uploadUrl/{fileId}")]
    public async Task<IActionResult> GetUploadUrl(Guid boardId, string fileId)
    {
        var result = await worldBoardService.GetUploadPresignedUrl(User.GetUserId(), boardId, fileId);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }
}
