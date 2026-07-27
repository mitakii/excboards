namespace Application.Auth;

public sealed record TokenPair(string AccessToken, string RefreshToken);

public enum RefreshTokenFailure
{
    NotFound,
    Reused,
    Expired,
}

public sealed class RefreshOutcome
{
    public bool Succeeded { get; }
    public TokenPair? Tokens { get; }
    public RefreshTokenFailure? Failure { get; }

    private RefreshOutcome(bool succeeded, TokenPair? tokens, RefreshTokenFailure? failure)
    {
        Succeeded = succeeded;
        Tokens = tokens;
        Failure = failure;
    }

    public static RefreshOutcome Ok(TokenPair tokens) => new(true, tokens, null);
    public static RefreshOutcome Fail(RefreshTokenFailure failure) => new(false, null, failure);
}
