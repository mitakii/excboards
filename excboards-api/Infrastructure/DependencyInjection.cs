using Application.Auth;
using Application.Boards;
using Application.Interfaces;
using Application.Storage;
using Application.Tags;
using BusinessLayer.DTO;
using Domain.Interfaces;
using Infrastructure.Identity;
using Infrastructure.Identity.Interfaces;
using Infrastructure.Identity.Repositories;
using Infrastructure.Identity.Services;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Security;
using Infrastructure.Storage;
using Infrastructure.Storage.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebSockets;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Minio;

namespace Infrastructure;

public static class InfrastructureServiceCollectionExtensions
{
    public static IHostApplicationBuilder AddInfrastructure(this IHostApplicationBuilder builder) =>
        builder.AddPersistence().AddStorage().AddIdentityAndAuth().AddBoardServices();

    public static IHostApplicationBuilder AddBackgroundWorkers(this IHostApplicationBuilder builder)
    {
        builder.Services.Configure<FileCleanupOptions>(
            builder.Configuration.GetSection("FileCleanupOptions"));
        builder.Services.Configure<BoardDeletionOptions>(
            builder.Configuration.GetSection("BoardDeletionOptions"));
        builder.Services.Configure<RefreshTokenCleanupOptions>(
            builder.Configuration.GetSection("RefreshTokenCleanupOptions"));

        builder.Services.AddScoped<OrphanedFileCleanupJob>();
        builder.Services.AddScoped<RefreshTokenCleanupJob>();
        builder.Services.AddScoped<DeletedBoardsCleanupJob>();
        
        return builder;
    }
    
    public static IHostApplicationBuilder AddIdentityAndAuth(this IHostApplicationBuilder builder)
    {
        builder.Services
            .AddIdentityCore<User>(options =>
            {
                options.Password.RequireUppercase = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = false;
                options.User.RequireUniqueEmail = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();
        builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("JwtOptions"));
        builder.Services.AddScoped<ITokenService, TokenService>();

        builder.Services.AddScoped<IUserService, UserService>();
        builder.Services.AddScoped<IAuthService, AuthService>();
        
        builder.Services.AddScoped<IUserRepository, UserRepository>();
        return builder;
    } 
    
    public static IHostApplicationBuilder AddStorage(this IHostApplicationBuilder builder)
    {
        builder.Services.Configure<MinioOptions>(builder.Configuration.GetSection("Minio"));
        builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));
        
        builder.Services.AddSingleton<MinioStorage>();
        builder.Services.AddScoped<IFileRepository, MinioFileRepository>();
        builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
        
        return builder;
    } 
    
    public static IHostApplicationBuilder AddPersistence(this IHostApplicationBuilder builder)
    {
        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
        
        builder.Services.AddScoped<IBoardRepository, BoardRepository>();

        return builder;
    }
    
    public static IHostApplicationBuilder AddBoardServices(this IHostApplicationBuilder builder)
    {
        builder.Services.AddScoped<IPermissionService, PermissionService>();
        builder.Services.AddScoped<ITagRepository, TagRepository>();
        builder.Services.AddScoped<TagService>();
        builder.Services.AddScoped<BoardService>();
        builder.Services.AddScoped<IBoardCollaboratorRepository, BoardCollaboratorRepository>();
        builder.Services.AddScoped<BoardCollaboratorService>();

        return builder;
    }
}
