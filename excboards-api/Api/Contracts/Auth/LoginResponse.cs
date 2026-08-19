namespace excboards_api.Contracts.Auth;

public sealed record LoginResponse(Guid UserId ,string Username, string Email);