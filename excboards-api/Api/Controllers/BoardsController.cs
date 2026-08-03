using Application.Boards;
using excboards_api.Contracts.Boards;
using excboards_api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/boards")]
[Authorize]
public class BoardsController(BoardService boardService) : ControllerBase
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

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await boardService.GetByIdAsync(User.GetUserId(), id);
        if (result.IsError)
            return result.ToProblem(this);

        var board = result.Value;
        return Ok(new BoardResponse(board.Id, board.Name, board.Description, board.IsPublished, board.Created, board.Updated));
    }

    [HttpGet("{id:guid}/scene")]
    public async Task<IActionResult> GetScene(Guid id)
    {
        var result = await boardService.GetSceneAsync(User.GetUserId(), id);
        if (result.IsError)
            return result.ToProblem(this);

        return File(result.Value, "application/json");
    }
}
