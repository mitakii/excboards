namespace excboards_api.Contracts.Auth;

public record GoogleLoginResponse(bool NeedsUsername, string? SuggestedUsername = null, LoginResponse? User = null);
