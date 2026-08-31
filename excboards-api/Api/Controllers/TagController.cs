using Application.Boards;
using Application.Mappers;
using Application.Tags;
using Domain.Interfaces;
using excboards_api.Contracts.Boards;
using excboards_api.Contracts.Tag;
using excboards_api.Extensions;
using excboards_api.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TagController(TagService tagService): ControllerBase
{
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] SearchRequest request)
    {
        var result = await tagService.Search(request.Query,  request.Page, request.PageSize);
        if(result.IsError)
            return result.ToProblem(this);
        
        return Ok(new SearchResponse<TagResponse>(
            Result: result.Value.Data.MapToResponse(), 
            result.Value.Page, 
            result.Value.PageSize, 
            result.Value.Total));
    }
}