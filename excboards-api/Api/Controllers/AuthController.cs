using System.Security.Claims;
using Application.Auth;
using Application.Interfaces;
using ErrorOr;
using excboards_api.Attributes;
using excboards_api.Contracts.Auth;
using excboards_api.Extensions;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    UserManager<User> userManager,
    IAuthService authService,
    ITokenService tokenService,
    IOptions<JwtOptions> jwtOptions,
    ICloudinaryService cloudinaryService) : ControllerBase
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    [AllowAnonymous]
    [HttpPost("register")]
    [ValidateImage(Required = false)]
    public async Task<IActionResult> Register([FromForm] RegisterRequest request)
    {
        var user = new User { UserName = request.Username, Email = request.Email };
        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            ErrorOr<Success> errorResult = result.Errors.Select(e => Error.Validation(e.Code, e.Description)).ToList();
            return errorResult.ToProblem(this);
        }

        if (request.Picture is { Length: > 0 })
        {
            var pfpResult = await cloudinaryService.AddPhotoAsync(request.Picture);
            user.ProfilePictureUrl = pfpResult.Value;
            await userManager.UpdateAsync(user);
        }

        return Created();
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await authService.LoginAsync(request.Username, request.Password);
        if (result.IsError) return result.ToProblem(this);

        var login = result.Value;
        Response.SetAuthCookies(login.Tokens.AccessToken, login.Tokens.RefreshToken, _jwtOptions);
        return Ok(new LoginResponse( login.UserId, login.UserName, login.Email));
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        if (!Request.Cookies.TryGetValue(AuthCookieNames.RefreshToken, out var raw) || string.IsNullOrEmpty(raw))
            return Unauthorized();

        var outcome = await tokenService.RefreshTokensAsync(raw);
        if (!outcome.Succeeded)
        {
            Response.ClearAuthCookies(_jwtOptions);
            return Unauthorized();
        }

        Response.SetAuthCookies(outcome.Tokens!.AccessToken, outcome.Tokens.RefreshToken, _jwtOptions);
        return Ok();
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await tokenService.RevokeRefreshTokensForUserAsync(User.GetUserId());
        Response.ClearAuthCookies(_jwtOptions);
        return Ok();
    }

    [Authorize]
    [HttpGet("status")]
    public IActionResult Status() => Ok(new
    {
        userId = User.FindFirstValue(ClaimTypes.Sid),
        userName = User.FindFirstValue(ClaimTypes.Name),
        email = User.FindFirstValue(ClaimTypes.Email),
    });
}
