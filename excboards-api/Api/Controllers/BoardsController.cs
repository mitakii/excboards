using Application.Boards;
using Application.Dto;
using excboards_api.Contracts.Boards;
using excboards_api.Extensions;
using excboards_api.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
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

        return Created($"/api/boards/{result.Value}", result.Value);
    }

    [HttpPatch("{boardId:guid}")]
    public async Task<IActionResult> UpdateBoard(Guid boardId, [FromBody] BoardUpdateRequest request)
    {
        var dto = new UserBoardUpdateDto()
        {
            Description = request.Description,
            Name = request.Name,
            Tags = request.Tags
        };
        
        var result = await boardService.UpdateBoardAsync(User.GetUserId(), boardId, dto);
        if(result.IsError)
            return result.ToProblem(this);
        
        return Ok();
    }

    [HttpDelete("{boardId:guid}")]
    public async Task<IActionResult> Delete(Guid boardId)
    {
        var result = await boardService.DeleteAsync(User.GetUserId(), boardId);
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

        return Ok(result.Value.MapToResponse());
    }
    
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await boardService.GetByIdAsync(User.GetUserId(), id);
        if (result.IsError)
            return result.ToProblem(this);
        
        return Ok(result.Value.MapToResponse());
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([AsParameters] SearchRequest request)
    {
        var result = await boardService.SearchAsync(User.GetUserId(), request.Query, request.Page, request.PageSize);
        if(result.IsError)
            return  result.ToProblem(this);
        
        return Ok(new SearchResponse<BoardResponse>(
            Result: result.Value.Data.MapToResponse(),
            result.Value.Total, 
            result.Value.Page, 
            result.Value.PageSize));
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

        var result = await boardService.SaveSceneAsync(User.GetUserId(), id, request.SceneHash, stream);
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
    
    [HttpGet("{boardId:guid}/downloadUrl/{fileId}")]
    public async Task<IActionResult> GetFilePresignedUrl(Guid boardId, string fileId)
    {
        var result = await boardService
            .GetDownloadPresignedUrl(User.GetUserId(), boardId, fileId);
        if(result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    [HttpGet("{boardId:guid}/uploadUrl/{fileId}")]
    public async Task<IActionResult> GetUploadUrl(Guid boardId, string fileId)
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

        return Created();
    }

    [HttpPut("{boardId:guid}/collaborators/{userId:guid}")]
    public async Task<IActionResult> UpdateCollaborator
        (Guid boardId, Guid userId, [FromBody] UpdateCollaboratorRequest request)
    {
        var result = await boardCollaboratorService
            .UpdateAsync(User.GetUserId(), boardId, userId, request.Permission);
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

    [HttpGet("{boardId:guid}/collaborators")]
    public async Task<IActionResult> GetBoardCollaborators(Guid boardId)
    {
        var result = await boardCollaboratorService.GetAllBoardCollaborators(boardId, User.GetUserId());
        
        if(result.IsError)
            return result.ToProblem(this);
        
        return Ok(result.Value.MapToResponse());
    }
}
