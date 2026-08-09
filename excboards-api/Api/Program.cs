using System.Text;
using excboards_api.Extensions;
using excboards_api.Hubs;
using Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.AddInfrastructure(); // DbContext + Identity + ITokenService + refresh-token cleanup job

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
        // Auth lives in an httpOnly cookie (JS can't read it), not the Authorization header.
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.TryGetValue(AuthCookieNames.AccessToken, out var token))
                context.Token = token;
            return Task.CompletedTask;
        },
    };
});

builder.Services.AddAuthorization();

builder.Services.AddSignalR();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseRouting();
app.UseCors("ExcboardsFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<CanvasHub>("/hubs/canvas");

app.Run();
