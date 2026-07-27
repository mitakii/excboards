using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Auth;
using Application.Interfaces;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Security;

public class TokenService : ITokenService
{
    private readonly JwtOptions _options;
    private readonly SymmetricSecurityKey _signingKey;
    private readonly AppDbContext _db;
    private readonly UserManager<User> _userManager;

    public TokenService(IOptions<JwtOptions> options, AppDbContext db, UserManager<User> userManager)
    {
        _options = options.Value;
        _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        _db = db;
        _userManager = userManager;
    }

    public Task<string> GenerateAccessTokenAsync(Guid userId, string userName, string email,
        IEnumerable<string>? roles = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Sid, userId.ToString()),
            new(ClaimTypes.Name, userName),
            new(ClaimTypes.Email, email),
        };
        if (roles is not null)
            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_options.AccessTokenMinutes),
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            SigningCredentials = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha512Signature),
        });
        return Task.FromResult(handler.WriteToken(token));
    }

    public async Task<string> GenerateRefreshTokenAsync(Guid userId)
    {
        var raw = Guid.NewGuid().ToString("N");
        _db.RefreshTokens.Add(new RefreshToken
        {
            TokenHash = TokenHasher.Hash(raw),
            UserId = userId,
            Expires = DateTime.UtcNow.AddDays(_options.RefreshTokenDays),
        });
        await _db.SaveChangesAsync();
        return raw;
    }

    public async Task<RefreshOutcome> RefreshTokensAsync(string rawRefreshToken)
    {
        var hash = TokenHasher.Hash(rawRefreshToken);
        var existing = await _db.RefreshTokens.Include(t => t.User)
            .SingleOrDefaultAsync(t => t.TokenHash == hash);

        if (existing is null)
            return RefreshOutcome.Fail(RefreshTokenFailure.NotFound);

        if (existing.IsUsed)
        {
            // Reuse of an already-rotated refresh token indicates the token was stolen; nuke entire generation
            // session this user holds rather than just the one that got reused.
            await _db.RefreshTokens.Where(t => t.UserId == existing.UserId).ExecuteDeleteAsync();
            return RefreshOutcome.Fail(RefreshTokenFailure.Reused);
        }

        if (existing.IsExpired)
        {
            _db.RefreshTokens.Remove(existing);
            await _db.SaveChangesAsync();
            return RefreshOutcome.Fail(RefreshTokenFailure.Expired);
        }

        existing.IsUsed = true;
        var newRaw = Guid.NewGuid().ToString("N");
        _db.RefreshTokens.Add(new RefreshToken
        {
            TokenHash = TokenHasher.Hash(newRaw),
            UserId = existing.UserId,
            Expires = DateTime.UtcNow.AddDays(_options.RefreshTokenDays),
        });
        await _db.SaveChangesAsync();

        var roles = await _userManager.GetRolesAsync(existing.User);
        var newAccess = await GenerateAccessTokenAsync(
            existing.UserId, existing.User.UserName!, existing.User.Email!, roles);

        return RefreshOutcome.Ok(new TokenPair(newAccess, newRaw));
    }

    public async Task RevokeRefreshTokensForUserAsync(Guid userId) =>
        await _db.RefreshTokens.Where(t => t.UserId == userId).ExecuteDeleteAsync();
}
