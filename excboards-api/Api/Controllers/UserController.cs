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
        var result = await userService
            .ChangePassword(User.GetUserId(), request.OldPassword, request.NewPassword);
        
        if(result.IsError)
            result.ToProblem(this);
        return Ok();
    }
    
    [Authorize]
    [HttpGet("settings/changeUsername")]
    public async Task<IActionResult> ChangeUsername(ChangeUsernameRequest request)
    {
        var result = await userService
            .ChangeUsername(User.GetUserId(), request.NewUsername, request.Password);
        
        if(result.IsError)
            result.ToProblem(this);
        return Ok();
    }
    
    [Authorize]
    [HttpGet("settings/changeEmail")]
    public async Task<IActionResult> ChangeUsername(ChangeEmailRequest request)
    {
        var result = await userService
            .ChangeEmail(User.GetUserId(), request.NewEmail, request.Password);
        
        if(result.IsError)
            result.ToProblem(this);
        return Ok();
    }
    
    [Authorize]
    [ValidateImage(Required = false)]
    [HttpGet("settings/changePfp")]
    public async Task<IActionResult> ChangePfp(ChangePfpRequest request)
    {
        var result = await userService.UpdatePfpAsync(User.GetUserId(), request.Picture, request.Password);
        
        if(result.IsError)
            result.ToProblem(this);
        return Ok();
    }
}