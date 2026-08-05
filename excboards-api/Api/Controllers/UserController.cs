using System.Security.Claims;
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
            result.ToProblem(this);
        
        return Ok(result);
    }

    [Authorize]
    [HttpGet("settings/changePassword")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.Sid), out var userId))
            return Unauthorized();

        var result = await userService
            .ChangePassword(userId, request.OldPassword, request.NewPassword);
        
        if(result.IsError)
            result.ToProblem(this);
        return Ok();
    }
    
    [Authorize]
    [HttpGet("settings/changeUsername")]
    public async Task<IActionResult> ChangeUsername(ChangeUsernameRequest request)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.Sid), out var userId))
            return Unauthorized();

        var result = await userService
            .ChangeUsername(userId, request.NewUsername, request.Password);
        
        if(result.IsError)
            result.ToProblem(this);
        return Ok();
    }
    
    [Authorize]
    [HttpGet("settings/changeEmail")]
    public async Task<IActionResult> ChangeUsername(ChangeEmailRequest request)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.Sid), out var userId))
            return Unauthorized();

        var result = await userService
            .ChangeEmail(userId, request.NewEmail, request.Password);
        
        if(result.IsError)
            result.ToProblem(this);
        return Ok();
    }
    
    [Authorize]
    [ValidateImage(Required = false)]
    [HttpGet("settings/changePfp")]
    public async Task<IActionResult> ChangePfp(ChangePfpRequest request)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.Sid), out var userId))
            return Unauthorized();

        var result = await userService.UpdatePfpAsync(userId, request.Picture, request.Password);
        
        if(result.IsError)
            result.ToProblem(this);
        return Ok();
    }
}