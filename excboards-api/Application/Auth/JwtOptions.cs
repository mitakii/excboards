namespace Application.Auth;

public sealed class JwtOptions
{
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string SigningKey { get; init; } = string.Empty;
    public int AccessTokenMinutes { get; init; } = 15;
    public int RefreshTokenDays { get; init; } = 14;

    /// Leading-dot form (".rootdomain.com") for prod so the cookie reaches the api. subdomain; empty for local dev.
    public string CookieDomain { get; init; } = string.Empty;
}
