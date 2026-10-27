using Infrastructure.Persistence;
using Infrastructure.Storage;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace excboards_api.Extensions;

public static class HealthCheckExtensions
{
    public static IServiceCollection AddExcboardsHealthChecks(this IServiceCollection services)
    {
        var check = services.AddHealthChecks()
            .AddDbContextCheck<AppDbContext>("postgres", tags: ["ready"])
            .AddCheck<S3HealthCheck>("s3", HealthStatus.Degraded, tags: ["ready"]);

        if(services.Any(d => d.ServiceType == typeof(IConnectionMultiplexer)))
            check.AddCheck<RedisHealthCheck>("redis", tags: ["ready"]);

        services.PostConfigure<HealthCheckServiceOptions>(options =>
        {
            foreach (var healthCheckRegistration in options.Registrations)
            {
                healthCheckRegistration.Timeout = TimeSpan.FromSeconds(2);
            }
        });
        
        return services;
    }

    public static void MapExcboardsHealthChecks(this WebApplication app)
    {
        app.MapHealthChecks("/health/live", new HealthCheckOptions {Predicate = _ => false});
        app.MapHealthChecks("/health/ready", new HealthCheckOptions {Predicate = c => c.Tags.Contains("ready")});
    }
}

public class S3HealthCheck(S3Storage storage) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context,
        CancellationToken cancellationToken = new()) =>
        await storage.BucketExistsAsync(cancellationToken)
            ? HealthCheckResult.Healthy()
            : new HealthCheckResult(context.Registration.FailureStatus, "Bucket not reachable");
}

public class RedisHealthCheck(IConnectionMultiplexer mux) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = new CancellationToken())
    {
        try
        {
            var latency = await mux.GetDatabase().PingAsync().WaitAsync(cancellationToken);
            return HealthCheckResult.Healthy($"{latency.TotalMilliseconds} ms");
        }
        catch (Exception e)
        {
            return HealthCheckResult.Unhealthy("Redis ping failed", e);
        }
    }
}
