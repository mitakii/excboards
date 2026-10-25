using System.Globalization;
using System.Text;
using Application.Auth;
using Application.Dto;
using Application.Interfaces;
using ErrorOr;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Infrastructure.Identity.Services;

public class AuthService(
    UserManager<User> userManager,
    SignInManager<User> signInManager,
    ITokenService tokenService,
    IOptions<GoogleAuthOptions> googleAuthOptions) : IAuthService
{
    
    private readonly GoogleAuthOptions _googleOptions =  googleAuthOptions.Value;
    private const int MinUserNameLength = 3;
    private const int MaxUserNameLength = 32;
    
    public async Task<ErrorOr<LoginResult>> LoginAsync(string username, string password)
    {
        var user = await userManager.FindByNameAsync(username);
        if (user is null)
            return Error.Unauthorized("Auth.InvalidCredentials", "Invalid username or password.");

        var check = await signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        if (!check.Succeeded)
            return Error.Unauthorized("Auth.InvalidCredentials", "Invalid username or password.");

        var tokenPair = await IssueTokenAsync(user);
        return new LoginResult(user.Id, user.UserName!, user.Email!, tokenPair);
    }
    
    public async Task<ErrorOr<GoogleLoginResult>> LoginWithGoogleAsync(string idToken)
    {
        var payload = await ValidateGoogleTokenAsync(idToken);
        if (!payload.IsSuccess)
            return payload.Errors;
        
        var user = await userManager.FindByLoginAsync("Google", payload.Value.Subject);
        if (user is not null)
        {
            if(user.IsBanned)
                return Banned();

            return GoogleLoginResult.LoggedIn(
                new LoginResult(user.Id, user.UserName!, user.Email!,
                    await IssueTokenAsync(user)));
        }
        
        if (await userManager.FindByEmailAsync(payload.Value.Email) is not null)
            return EmailInUse();

        return GoogleLoginResult.SignupRequired(await GenerateUniqueUserNameAsync(payload.Value));
    }

    public async Task<ErrorOr<LoginResult>> RegisterWithGoogleAsync(string idToken, string username)
    {
        var payload = await ValidateGoogleTokenAsync(idToken);
        if (!payload.IsSuccess)
            return payload.Errors;

        var existing = await userManager.FindByLoginAsync("Google", payload.Value.Subject);
        if (existing is not null)
        {
            if (existing.IsBanned)
                return Banned();

            return new LoginResult(existing.Id, existing.UserName!, existing.Email!,
                await IssueTokenAsync(existing));
        }

        if(await userManager.FindByEmailAsync(payload.Value.Email) is not null)
            return EmailInUse();

        var user = new User
        {
            UserName = username,
            Email = payload.Value.Email,
            EmailConfirmed = false,
            ProfilePictureUrl = payload.Value.Picture ?? ""
        };
        
        var created = await userManager.CreateAsync(user);
        if (!created.Succeeded)
            return created.Errors
                .Select(e => Error.Validation(e.Code, e.Description))
                .ToList();
        
        var linked = await userManager.AddLoginAsync(user,
            new UserLoginInfo("Google", payload.Value.Subject, "Google"));
        if (!linked.Succeeded)
        {
            await userManager.DeleteAsync(user);
            return linked.Errors
                .Select(e => Error.Failure(e.Code, e.Description))
                .ToList();
        }

        return new LoginResult(user.Id, user.UserName!, user.Email!,
            await IssueTokenAsync(user));
    }
    

    private async Task<ErrorOr<GoogleJsonWebSignature.Payload>> ValidateGoogleTokenAsync(string idToken)
    {
        try
        {
            return await GoogleJsonWebSignature
                .ValidateAsync(idToken, 
                    new GoogleJsonWebSignature.ValidationSettings 
                        {Audience = [_googleOptions.ClientId]});
        }
        catch(InvalidJwtException)
        {
            return Error.Unauthorized("Auth.InvalidGoogleToken", "Invalid google token");
        }
    }
    
    private static Error EmailInUse() => Error.Conflict("Auth.EmailInUse",
        "An account with this email already exists. Sign in with your password and link Google from your profile.");
    
    private static Error Banned() => Error.Forbidden("Auth.Banned", "User is banned");

    private async Task<string> GenerateUniqueUserNameAsync(GoogleJsonWebSignature.Payload payload)
    {
        var baseName = new[] { payload.Name, payload.GivenName, payload.Email.Split('@')[0] }
            .Select(SanitizeUserName)
            .FirstOrDefault(n => n.Length >= MinUserNameLength) ?? "user";
        
        baseName = baseName[..Math.Min(baseName.Length, MaxUserNameLength - 5)];

        if (await userManager.FindByNameAsync(baseName) is null)
            return baseName;

        for (var i = 0; i < 10; i++)
        {
            var candidate = $"{baseName}_{Random.Shared.Next(1000, 10000)}";
            if (await userManager.FindByNameAsync(candidate) is null)
                return candidate;
        }

        return $"{baseName[..Math.Min(baseName.Length, MaxUserNameLength - 9)]}_{Guid.NewGuid().ToString("N")[..8]}";
    }

    private string SanitizeUserName(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;

        var allowed = userManager.Options.User.AllowedUserNameCharacters;
        
        var stripped = new string(raw.Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            .ToArray());

        return new string(stripped.Trim()
            .Select(c => char.IsWhiteSpace(c) ? '_' : c)
            .Where(c => allowed.Contains(c) && c != '@')
            .ToArray());
    }

    private async Task<TokenPair> IssueTokenAsync(User user)
    {
        await tokenService.RevokeRefreshTokensForUserAsync(user.Id);

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = await tokenService.GenerateAccessTokenAsync(user.Id, user.UserName!, user.Email!, roles);
        var refreshToken = await tokenService.GenerateRefreshTokenAsync(user.Id);
        
        return new TokenPair(accessToken, refreshToken);
    }
    
}
