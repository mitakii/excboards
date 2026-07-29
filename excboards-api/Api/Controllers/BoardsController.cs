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
    public async Task<IActionResult> Create(CreateBoardRequest request)
    {
        var boardId = await boardService.CreateBoardAsync(User.GetUserId(), request.Name, request.Description ?? string.Empty);
        return Created(string.Empty, new { id = boardId });
    }
}
