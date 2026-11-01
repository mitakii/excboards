using Application.Dto;
using Application.Storage;
using Domain.Entities;
using Infrastructure.Persistence;
using Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Tests.Fakes;
using Xunit;

namespace Tests.Storage;

public class DeletedBoardsCleanupJobTests
{
    private static AppDbContext CreateDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static UserBoard MakeBoard(DateTime? deletedAt) => new()
    {
        Id = Guid.NewGuid(),
        UserId = Guid.NewGuid(),
        Name = "Test board",
        NormalizedName = "test board",
        Description = "",
        Created = DateTime.UtcNow.AddDays(-30),
        Updated = DateTime.UtcNow.AddDays(-30),
        DeletedAt = deletedAt,
    };

    private static DeletedBoardsCleanupJob CreateJob(
        AppDbContext db, FakeFileRepository files, FakeBoardRepository boards, int gracePeriodDays = 7) =>
        new(db, files, boards,
            Options.Create(new BoardDeletionOptions { GracePeriodDays = gracePeriodDays }),
            NullLogger<DeletedBoardsCleanupJob>.Instance);

    [Fact]
    public async Task PurgesBoardsPastGracePeriod_AndDeletesTheirStorage()
    {
        await using var db = CreateDb();
        var board = MakeBoard(DateTime.UtcNow.AddDays(-10)); // past the 7-day grace period
        db.UserBoards.Add(board);
        await db.SaveChangesAsync();

        var files = new FakeFileRepository();
        files.ObjectsByPrefix[BoardFileKeys.FilesPrefix(board.Id)] =
        [
            new StorageObjectInfo(BoardFileKeys.File(board.Id, "f1"), DateTime.UtcNow),
            new StorageObjectInfo(BoardFileKeys.File(board.Id, "f2"), DateTime.UtcNow),
        ];
        var boards = new FakeBoardRepository();

        await CreateJob(db, files, boards).RunAsync(CancellationToken.None);

        Assert.Single(boards.DeletedBoards);
        Assert.Equal(board.Id, boards.DeletedBoards[0].Id);
        Assert.Contains(BoardFileKeys.Scene(board.Id), files.DeletedFileKeys);
        var batch = Assert.Single(files.DeletedFileBatches);
        Assert.Equal(2, batch.Count);
    }

    [Fact]
    public async Task LeavesBoardAlone_WhenNotYetPastGracePeriod()
    {
        await using var db = CreateDb();
        var board = MakeBoard(DateTime.UtcNow.AddDays(-2)); // within the 7-day grace period
        db.UserBoards.Add(board);
        await db.SaveChangesAsync();

        var files = new FakeFileRepository();
        var boards = new FakeBoardRepository();

        await CreateJob(db, files, boards).RunAsync(CancellationToken.None);

        Assert.Empty(boards.DeletedBoards);
        Assert.Empty(files.DeletedFileKeys);
    }

    [Fact]
    public async Task LeavesBoardAlone_WhenNotSoftDeleted()
    {
        await using var db = CreateDb();
        var board = MakeBoard(deletedAt: null); // still a live board
        db.UserBoards.Add(board);
        await db.SaveChangesAsync();

        var files = new FakeFileRepository();
        var boards = new FakeBoardRepository();

        await CreateJob(db, files, boards).RunAsync(CancellationToken.None);

        Assert.Empty(boards.DeletedBoards);
        Assert.Empty(files.DeletedFileKeys);
    }

    [Fact]
    public async Task OneBoardsStorageFailure_DoesNotBlockOtherBoards()
    {
        await using var db = CreateDb();
        var good1 = MakeBoard(DateTime.UtcNow.AddDays(-10));
        var bad = MakeBoard(DateTime.UtcNow.AddDays(-10));
        var good2 = MakeBoard(DateTime.UtcNow.AddDays(-10));
        db.UserBoards.AddRange(good1, bad, good2);
        await db.SaveChangesAsync();

        var files = new FakeFileRepository
        {
            ThrowOnPrefix = prefix => prefix == BoardFileKeys.FilesPrefix(bad.Id),
        };
        var boards = new FakeBoardRepository();

        // Must complete without throwing, despite one board's storage cleanup failing.
        await CreateJob(db, files, boards).RunAsync(CancellationToken.None);

        var purgedIds = boards.DeletedBoards.Select(b => b.Id).ToHashSet();
        Assert.Equal(2, boards.DeletedBoards.Count);
        Assert.Contains(good1.Id, purgedIds);
        Assert.Contains(good2.Id, purgedIds);
        Assert.DoesNotContain(bad.Id, purgedIds);
    }

    [Fact]
    public async Task AlreadyCancelledToken_StopsBeforeProcessingAnyBoard()
    {
        await using var db = CreateDb();
        var board = MakeBoard(DateTime.UtcNow.AddDays(-10));
        db.UserBoards.Add(board);
        await db.SaveChangesAsync();

        var files = new FakeFileRepository();
        var boards = new FakeBoardRepository();

        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => CreateJob(db, files, boards).RunAsync(cts.Token));

        Assert.Empty(boards.DeletedBoards);
        Assert.Empty(files.DeletedFileKeys);
    }
}
