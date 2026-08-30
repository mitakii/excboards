using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Security;

public sealed class RefreshTokenCleanupJob(
    AppDbContext db,
    ILogger<RefreshTokenCleanupJob> logger)
{
    public async Task RunAsync(CancellationToken stoppingToken)
    {
        try
        {
            var now = DateTime.UtcNow;
            var deleted = await db.RefreshTokens
                .Where(t => t.IsUsed || t.Expires < now)
                .ExecuteDeleteAsync(stoppingToken);
            if (deleted > 0)
                logger.LogInformation("Cleaned up {Count} stale refresh tokens", deleted);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Refresh token cleanup failed");
        }
    }
}