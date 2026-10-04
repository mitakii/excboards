using System.Security.Claims;

namespace excboards_api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal) =>
        Guid.Parse(principal.FindFirstValue(ClaimTypes.Sid)!);

    // null for anonymous requests, use on endpoints that allow them
    public static Guid? TryGetUserId(this ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.Sid), out var id) ? id : null;
}
