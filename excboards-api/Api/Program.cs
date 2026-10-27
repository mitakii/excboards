using System.Text;
using Application.Storage;
using excboards_api.Extensions;
using excboards_api.Hubs;
using Hangfire;
using Hangfire.PostgreSql;
using Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.SignalR.StackExchangeRedis;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.AddInfrastructure(); // DbContext + Identity + ITokenService + Redis

var jwtSection = builder.Configuration.GetSection("JwtOptions");
var jwtIssuer = jwtSection["Issuer"] ?? throw new InvalidOperationException("JwtOptions:Issuer is missing");
var jwtAudience = jwtSection["Audience"] ?? throw new InvalidOperationException("JwtOptions:Audience is missing");
var jwtSigningKey = jwtSection["SigningKey"] ?? throw new InvalidOperationException("JwtOptions:SigningKey is missing");

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("ExcboardsFrontend", policy => policy
        .WithOrigins(corsOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30),
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.TryGetValue(AuthCookieNames.AccessToken, out var token))
                context.Token = token;
            return Task.CompletedTask;
        },
    };
});

builder.Services.AddAuthorization();
builder.Services.AddExcboardsRateLimiting();

var signalR = builder.Services.AddSignalR();
// Backplane reuses the multiplexer AddRedis() registered (only when Redis is configured)
if (builder.Services.Any(d => d.ServiceType == typeof(IConnectionMultiplexer)))
{
    signalR.AddStackExchangeRedis();
    builder.Services.AddOptions<RedisOptions>()
        .Configure<IConnectionMultiplexer>((options, mux) =>
            options.ConnectionFactory = _ => Task.FromResult(mux));
}

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddHangfire(config => 
    config.UsePostgreSqlStorage(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddExcboardsHealthChecks();

var app = builder.Build();

app.UseExceptionHandler("/error");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseRouting();
app.UseCors("ExcboardsFrontend");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapHangfireDashboard("/hangfire", new DashboardOptions()
{
    Authorization = new []
    {
        new AuthorizationFilter()
    }
});

app.MapControllers();
app.MapExcboardsHealthChecks();
app.MapHub<CanvasHub>("/hubs/canvas");

app.Run();
