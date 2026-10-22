using Application.Auth;

namespace Application.Dto;

public sealed record GoogleLoginResult(LoginResult? Login, string? Suggested)
{
    public static GoogleLoginResult LoggedIn(LoginResult login) => new(login, null);
    public static GoogleLoginResult SignupRequired(string suggested) => new(null, suggested);
}