namespace Application.Auth;

public sealed record LoginResult(Guid UserId, string UserName, string Email, TokenPair Tokens);
