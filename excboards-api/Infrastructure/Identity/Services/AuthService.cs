using Application.Auth;
using Application.Interfaces;
using ErrorOr;
using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Identity.Services;

public class AuthService(
    UserManager<User> userManager,
    SignInManager<User> signInManager,
    ITokenService tokenService) : IAuthService
{
    public async Task<ErrorOr<LoginResult>> LoginAsync(string username, string password)
    {
        var user = await userManager.FindByNameAsync(username);
        if (user is null)
            return Error.Unauthorized("Auth.InvalidCredentials", "Invalid username or password.");

        var check = await signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        if (!check.Succeeded)
            return Error.Unauthorized("Auth.InvalidCredentials", "Invalid username or password.");

        await tokenService.RevokeRefreshTokensForUserAsync(user.Id);

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = await tokenService.GenerateAccessTokenAsync(user.Id, user.UserName!, user.Email!, roles);
        var refreshToken = await tokenService.GenerateRefreshTokenAsync(user.Id);

        return new LoginResult(user.Id, user.UserName!, user.Email!, new TokenPair(accessToken, refreshToken));
    }
}
