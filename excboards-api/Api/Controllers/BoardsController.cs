using Application.Boards;
using excboards_api.Contracts.Boards;
using excboards_api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/boards")]
[Authorize]
public class BoardsController
    (BoardService boardService, BoardCollaboratorService boardCollaboratorService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateBoardRequest request)
    {
        await using var stream = request.Scene.OpenReadStream();
        
        var result = await boardService
            .CreateAsync(User.GetUserId(), request.Name, request.Description ?? string.Empty, stream);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    [HttpDelete("{boardId:guid}")]
    public async Task<IActionResult> Delete(Guid boardId)
    {
        var result = await boardService.RemoveAsync(User.GetUserId(), boardId);
        if (result.IsError)
            return result.ToProblem(this);
        
        return Ok();
    }

    [HttpGet("u/{userId:guid}")]
    public async Task<IActionResult> GetUserBoards(Guid userId, [FromQuery] PagedRequest request)
    {
        var result = await boardService
            .GetUserBoards(userId, User.GetUserId(), request.Page, request.PageSize);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value.Select(board => new BoardResponse
            (board.Id, board.Name, board.Description, board.IsPublished, board.Created, board.Updated)));
    }
    
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await boardService.GetByIdAsync(User.GetUserId(), id);
        if (result.IsError)
            return result.ToProblem(this);

        var board = result.Value;
        return Ok(new BoardResponse
            (board.Id, board.Name, board.Description, board.IsPublished, board.Created, board.Updated));
    }

    [HttpGet("{id:guid}/scene")]
    public async Task<IActionResult> GetScene(Guid id)
    {
        var result = await boardService.GetSceneAsync(User.GetUserId(), id);
        if (result.IsError)
            return result.ToProblem(this);

        return File(result.Value, "application/json");
    }

    [HttpPut("{id:guid}/scene")]
    public async Task<IActionResult> SaveScene(Guid id, [FromForm] SaveSceneRequest request)
    {
        await using var stream = request.Scene.OpenReadStream();

        var result = await boardService.SaveSceneAsync(User.GetUserId(), id, stream);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok();
    }

    [HttpPost("{boardId:guid}/downloadUrls")]
    public async Task<IActionResult> GetFilePresignedUrls(Guid boardId, [FromBody] BoardPresignedUrlsRequest request)
    {
        if(request.FileIds is null or {Count: 0})
            return BadRequest();
        
        var result = await boardService
            .GetDownloadPresignedUrls(User.GetUserId(), boardId, request.FileIds);
        if(result.IsError)
            return result.ToProblem(this);
        
        return Ok(result.Value);
    }
    
    [HttpGet("{boardId:guid}/downloadUrl/{fileId:guid}")]
    public async Task<IActionResult> GetFilePresignedUrl(Guid boardId, Guid fileId)
    {
        var result = await boardService
            .GetDownloadPresignedUrl(User.GetUserId(), boardId, fileId);
        if(result.IsError)
            return result.ToProblem(this);
        
        return Ok(result.Value);
    }

    [HttpGet("{boardId:guid}/uploadUrl/{fileId:guid}")]
    public async Task<IActionResult> GetUploadUrl(Guid boardId, Guid fileId)
    {
        var result = await boardService.GetUploadPresignedUrl(User.GetUserId(), boardId, fileId);
        if (result.IsError)
            return result.ToProblem(this);
        
        return Ok(result.Value);
    }

    [HttpPost("{id:guid}/collaborators")]
    public async Task<IActionResult> AddCollaborator(Guid id, [FromBody] AddCollaboratorRequest request)
    {
        var result = await boardCollaboratorService
            .AddAsync(User.GetUserId(), id, request.UserId, request.Permission);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok();
    }

    [HttpPut("{id:guid}/collaborators/{userId:guid}")]
    public async Task<IActionResult> UpdateCollaborator
        (Guid id, Guid userId, [FromBody] UpdateCollaboratorRequest request)
    {
        var result = await boardCollaboratorService
            .UpdateAsync(User.GetUserId(), id, userId, request.Permission);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok();
    }

    [HttpDelete("{id:guid}/collaborators/{userId:guid}")]
    public async Task<IActionResult> RemoveCollaborator(Guid id, Guid userId)
    {
        var result = await boardCollaboratorService
            .RemoveAsync(User.GetUserId(), id, userId);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok();
    }
}
