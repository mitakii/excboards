using Application.Storage;
using Hangfire;
using Hangfire.PostgreSql;
using Infrastructure;
using Infrastructure.Identity;
using Infrastructure.Security;
using Infrastructure.Storage;
using Microsoft.Extensions.Options;

var builder = Host.CreateApplicationBuilder(args);

builder.AddStorage().AddPersistence().AddBackgroundWorkers();

builder.Services.AddHangfire(config => 
    config.UsePostgreSqlStorage(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHangfireServer();

var host = builder.Build();

var fileCleanup = host.Services.GetRequiredService<IOptions<FileCleanupOptions>>().Value;
var boardCleanup = host.Services.GetRequiredService<IOptions<BoardDeletionOptions>>().Value;
var refreshTokenOptions = host.Services.GetRequiredService<IOptions<RefreshTokenCleanupOptions>>().Value;

var recurringJobs = host.Services.GetRequiredService<IRecurringJobManager>();
recurringJobs.AddOrUpdate<OrphanedFileCleanupJob>(
    "orphaned-file-cleanup",
    j => j.RunAsync(CancellationToken.None),
    HourlyCron(fileCleanup.IntervalHours));

recurringJobs.AddOrUpdate<DeletedBoardsCleanupJob>(
    "board-cleanup",
    j => j.RunAsync(CancellationToken.None),
    HourlyCron(boardCleanup.IntervalHours));

recurringJobs.AddOrUpdate<RefreshTokenCleanupJob>(
    "refresh-token-cleanup",
    j => j.RunAsync(CancellationToken.None),
    Cron.DayInterval(refreshTokenOptions.RefreshTokenCleanupPeriodInDays));

host.Run();
static string HourlyCron(int hours) => hours >= 24 ? Cron.Daily() : Cron.HourInterval(hours);