using System.Security.Claims;
using Application.Dto;
using Application.Interfaces;
using excboards_api.Attributes;
using excboards_api.Contracts.Boards;
using excboards_api.Contracts.User;
using excboards_api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController(IUserService userService) : ControllerBase
{
    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> Get(Guid userId)
    {
        var result = await userService.GetUserByIdAsync(userId);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    [HttpGet("username/{username}")]
    public async Task<IActionResult> GetByUsername(string username)
    {
        var result = await userService.GetUserByNameAsync(username);
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(result.Value);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchUser([AsParameters] SearchRequest request)
    {
        var result = await userService.SearchAsync(request.Query, request.Page, request.PageSize);
        if(result.IsError)
            return result.ToProblem(this);
        
        return Ok(new SearchResponse<UserDto>(
            result.Value.Data.ToList(),
            result.Value.Data.Count,
            result.Value.Page,
            result.Value.PageSize
        ));
    }

    [Authorize]
    [HttpPost("settings/changePassword")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var result = await userService
            .ChangePassword(User.GetUserId(), request.OldPassword, request.NewPassword);
        if(result.IsError)
            return result.ToProblem(this);
        
        return Ok();
    }

    [Authorize]
    [HttpPost("settings/changeUsername")]
    public async Task<IActionResult> ChangeUsername(ChangeUsernameRequest request)
    {
        var result = await userService
            .ChangeUsername(User.GetUserId(), request.NewUsername, request.Password);

        if(result.IsError)
            return result.ToProblem(this);
        return Ok();
    }

    [Authorize]
    [HttpPost("settings/changeEmail")]
    public async Task<IActionResult> ChangeEmail(ChangeEmailRequest request)
    {
        var result = await userService
            .ChangeEmail(User.GetUserId(), request.NewEmail, request.Password);

        if(result.IsError)
            return result.ToProblem(this);
        return Ok();
    }

    [Authorize]
    [ValidateImage(Required = false)]
    [HttpPost("settings/changePfp")]
    public async Task<IActionResult> ChangePfp([FromForm] ChangePfpRequest request)
    {
        var result = await userService.UpdatePfpAsync(User.GetUserId(), request.Picture, request.Password);

        if(result.IsError)
            return result.ToProblem(this);
        return Ok();
    }
}