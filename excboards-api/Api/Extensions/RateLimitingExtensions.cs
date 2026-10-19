using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using RedisRateLimiting;
using StackExchange.Redis;

namespace excboards_api.Extensions;

public static class RateLimitPolicies
{
    public const string SceneSave = "scene-save";
    public const string UploadUrl = "upload-url";
}

public static class RateLimitingExtensions
{
    // In-memory, per API replica. Fine at a single replica; needs a shared store if scaled out.
    public static IServiceCollection AddExcboardsRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = (context, _) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                return ValueTask.CompletedTask;
            };
            
            options.AddPolicy(RateLimitPolicies.SceneSave, context =>
                PerUserFixedWindow(context, permitLimit: 60, RateLimitPolicies.SceneSave));
            options.AddPolicy(RateLimitPolicies.UploadUrl, context =>
                PerUserFixedWindow(context, permitLimit: 30,  RateLimitPolicies.UploadUrl));
        });
        return services;
    }

    private static RateLimitPartition<string> PerUserFixedWindow(HttpContext context, int permitLimit, string policy)
    {
        var key = $"{policy}:{context.User.TryGetUserId()?.ToString()               
                          ?? context.Connection.RemoteIpAddress?.ToString() 
                          ?? "anonymous"}";

        var mux = context.RequestServices.GetService<IConnectionMultiplexer>();
        if (mux is null)
        {
            return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            });
        }

        return RedisRateLimitPartition.GetFixedWindowRateLimiter(key, _ => new RedisFixedWindowRateLimiterOptions()
        {
            ConnectionMultiplexerFactory = () => mux,
            PermitLimit = permitLimit,
            Window = TimeSpan.FromMinutes(1),
        });
    }
}
