using Application.Auth;

namespace excboards_api.Extensions;

public static class AuthCookieNames
{
    public const string AccessToken = "excalidraw_accessToken";
    public const string RefreshToken = "excalidraw_refreshToken";
}

public static class AuthCookieExtensions
{
    public static void SetAuthCookies(this HttpResponse response, string accessToken, string refreshToken, JwtOptions options)
    {
        var domain = string.IsNullOrEmpty(options.CookieDomain) ? null : options.CookieDomain;

        response.Cookies.Append(AuthCookieNames.AccessToken, accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Domain = domain,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddMinutes(options.AccessTokenMinutes),
        });

        response.Cookies.Append(AuthCookieNames.RefreshToken, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Domain = domain,
            Path = "/api/auth/refresh",
            Expires = DateTimeOffset.UtcNow.AddDays(options.RefreshTokenDays),
        });
    }

    public static void ClearAuthCookies(this HttpResponse response, JwtOptions options)
    {
        var domain = string.IsNullOrEmpty(options.CookieDomain) ? null : options.CookieDomain;
        response.Cookies.Delete(AuthCookieNames.AccessToken, new CookieOptions { Domain = domain, Path = "/" });
        response.Cookies.Delete(AuthCookieNames.RefreshToken, new CookieOptions { Domain = domain, Path = "/api/auth/refresh" });
    }
}
