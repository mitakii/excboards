using System.Security.Claims;
using Application.Auth;
using Application.Interfaces;
using excboards_api.Contracts.Auth;
using excboards_api.Extensions;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<User> userManager,
    SignInManager<User> signInManager,
    ITokenService tokenService,
    IOptions<JwtOptions> jwtOptions) : ControllerBase
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var user = new User { UserName = request.Username, Email = request.Email };
        var result = await userManager.CreateAsync(user, request.Password);
        return result.Succeeded ? Created() : BadRequest(result.Errors.Select(e => e.Description));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await userManager.FindByNameAsync(request.Username);
        if (user is null) return Unauthorized();

        var check = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!check.Succeeded) return Unauthorized();

        await tokenService.RevokeRefreshTokensForUserAsync(user.Id);

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = await tokenService.GenerateAccessTokenAsync(user.Id, user.UserName!, user.Email!, roles);
        var refreshToken = await tokenService.GenerateRefreshTokenAsync(user.Id);

        Response.SetAuthCookies(accessToken, refreshToken, _jwtOptions);
        return Ok(new { user.Id, user.UserName, user.Email });
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
