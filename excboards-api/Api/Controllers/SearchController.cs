using Application.Boards;
using Application.Dto;
using Application.Interfaces;
using Application.Tags;
using Domain.Dto;
using ErrorOr;
using excboards_api.Contracts;
using excboards_api.Contracts.Search;
using excboards_api.Extensions;
using Infrastructure.Identity.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SearchController(
    BoardService boardService, 
    TagService tagService, 
    IUserService userService, 
    ILogger<SearchController> logger) : ControllerBase
{
    private const int MaxPageSize = 50;
    private static int ClampPageSize(int pageSize) => Math.Clamp(pageSize, 1, MaxPageSize);

    [HttpGet("board")]
    public async Task<IActionResult> SearchBoard([FromQuery] SearchRequest searchRequest)
    {
        if (string.IsNullOrWhiteSpace(searchRequest.Query))
            return NotFound();

        if (!PageCursor.TryParseTime(searchRequest.Cursor, out var cursor))
            return this.InvalidCursor();

        var result = await boardService
            .SearchAsync(User.TryGetUserId(), searchRequest.Query, cursor, ClampPageSize(searchRequest.PageSize));

        if (result.IsError)
        {
            logger.LogError("Board search error {errors} for {user} with \"{query}\" request", result.Errors, User.TryGetUserId(), searchRequest.Query);
            return result.ToProblem(this);
        }
        
        return Ok(result.Value.ToResponse());
    }
    
    [HttpGet("tag")]
    public async Task<IActionResult> SearchTag([FromQuery] SearchRequest searchRequest)
    {
        if (string.IsNullOrWhiteSpace(searchRequest.Query))
            return NotFound();

        var tags = searchRequest.Query
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(t => t.TrimStart('#'))
            .Where(t => t.Length > 0)
            .ToList();

        if (!PageCursor.TryParseTime(searchRequest.Cursor, out var cursor))
            return this.InvalidCursor();

        var result = await boardService
            .SearchByTagsAsync(
                User.TryGetUserId(), tags, cursor, ClampPageSize(searchRequest.PageSize));

        if (result.IsError)
        {
            logger.LogError("Tag search error {errors} for {user} with \"{query}\" request", result.Errors, User.TryGetUserId(), searchRequest.Query);
            return result.ToProblem(this);
        }

        return Ok(result.Value.ToResponse());
    }
    
    [HttpGet("user")]
    public async Task<IActionResult> SearchUser([FromQuery] SearchRequest searchRequest)
    {
        if (string.IsNullOrWhiteSpace(searchRequest.Query))
            return NotFound();

        if (!PageCursor.TryParse(searchRequest.Cursor, out var cursor))
            return this.InvalidCursor();

        var result = await userService
            .SearchAsync(searchRequest.Query, cursor, ClampPageSize(searchRequest.PageSize));
        
        if (result.IsError)
        {
            logger.LogError("User search error {errors} for user:{user} with \"{query}\" request", result.Errors, User.TryGetUserId(), searchRequest.Query);
            return result.ToProblem(this);
        }
        
        return Ok(result.Value.ToResponse());
    }
}