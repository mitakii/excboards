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
public class SearchController(BoardService boardService, TagService tagService, IUserService userService, ILogger<SearchController> logger) : ControllerBase
{
    [HttpGet("board")]
    public async Task<IActionResult> SearchBoard([FromQuery] SearchRequest searchRequest)
    {
        if (string.IsNullOrWhiteSpace(searchRequest.Query))
            return NotFound();

        var result = await boardService.SearchAsync(User.TryGetUserId(), searchRequest.Query, searchRequest.Page, searchRequest.PageSize);

        if (result.IsError)
        {
            logger.LogError("Board search error {errors} for {user} with \"{query}\" request", result.Errors, User.TryGetUserId(), searchRequest.Query);
            return result.ToProblem(this);
        }
        
        return Ok(new PagedResponse<BoardSummaryDto>(
                Result: result.Value.Data,
                result.Value.Total, 
                result.Value.Page, 
                result.Value.PageSize)
        );
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

        var result = await boardService.SearchByTagsAsync(User.TryGetUserId(), tags, searchRequest.Page, searchRequest.PageSize);

        if (result.IsError)
        {
            logger.LogError("Tag search error {errors} for {user} with \"{query}\" request", result.Errors, User.TryGetUserId(), searchRequest.Query);
            return result.ToProblem(this);
        }

        return Ok(new PagedResponse<BoardSummaryDto>(
                Result: result.Value.Data,
                result.Value.Total,
                result.Value.Page,
                result.Value.PageSize)
        );
    }
    
    [HttpGet("user")]
    public async Task<IActionResult> SearchUser([FromQuery] SearchRequest searchRequest)
    {
        if (string.IsNullOrWhiteSpace(searchRequest.Query))
            return NotFound();

        var result = await userService.SearchAsync(searchRequest.Query, searchRequest.Page, searchRequest.PageSize);
        
        if (result.IsError)
        {
            logger.LogError("User search error {errors} for user:{user} with \"{query}\" request", result.Errors, User.TryGetUserId(), searchRequest.Query);
            return result.ToProblem(this);
        }
        
        return Ok(new PagedResponse<UserDto>(
                result.Value.Data,
                result.Value.Total,
                result.Value.Page,
                result.Value.PageSize)
        );
    }
}