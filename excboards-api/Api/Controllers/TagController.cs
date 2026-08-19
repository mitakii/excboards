using Application.Boards;
using Application.Mappers;
using Application.Tags;
using Domain.Interfaces;
using excboards_api.Contracts.Boards;
using excboards_api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TagController(TagService tagService): ControllerBase
{
    [HttpGet("search")]
    public async Task<IActionResult> Search([AsParameters] SearchRequest request)
    {
        var result = await tagService.Search(request.Query,  request.Page, request.PageSize);
        if(result.IsError)
            return result.ToProblem(this);
        
        return Ok(result.Value.MapToDto());
    }
}