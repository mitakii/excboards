using Application.Auth;

namespace Application.Interfaces;

public interface ITokenService
{
    Task<string> GenerateAccessTokenAsync(Guid userId, string userName, string email,
        IEnumerable<string>? roles = null);

    Task<string> GenerateRefreshTokenAsync(Guid userId);

    Task<RefreshOutcome> RefreshTokensAsync(string rawRefreshToken);

    Task RevokeRefreshTokensForUserAsync(Guid userId);
}
