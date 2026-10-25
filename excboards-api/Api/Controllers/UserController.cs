using System.Security.Claims;
using Application.Dto;
using Application.Interfaces;
using excboards_api.Attributes;
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

    [Authorize]
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var result = await userService.HasPasswordAsync(User.GetUserId());
        if (result.IsError)
            return result.ToProblem(this);

        return Ok(new { hasPassword = result.Value });
    }

    [Authorize]
    [HttpPost("settings/setPassword")]
    public async Task<IActionResult> SetPassword(SetPasswordRequest request)
    {
        var result = await userService.SetPassword(User.GetUserId(), request.NewPassword);
        if(result.IsError)
            return result.ToProblem(this);

        return Ok();
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
            .ChangeUsername(User.GetUserId(), request.NewUsername);

        if(result.IsError)
            return result.ToProblem(this);
        return Ok();
    }

    [Authorize]
    [HttpPost("settings/changeEmail")]
    public async Task<IActionResult> ChangeEmail(ChangeEmailRequest request)
    {
        var result = await userService
            .ChangeEmail(User.GetUserId(), request.NewEmail);

        if(result.IsError)
            return result.ToProblem(this);
        return Ok();
    }

    [Authorize]
    [ValidateImage(Required = false)]
    [HttpPost("settings/changePfp")]
    public async Task<IActionResult> ChangePfp([FromForm] ChangePfpRequest request)
    {
        var result = await userService.UpdatePfpAsync(User.GetUserId(), request.Picture);

        if(result.IsError)
            return result.ToProblem(this);
        return Ok();
    }
}