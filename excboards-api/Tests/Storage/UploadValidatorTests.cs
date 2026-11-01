using Application.Dto;
using Application.Storage;
using ErrorOr;
using Tests.Fakes;
using Xunit;

namespace Tests.Storage;

public class UploadValidatorTests
{
    private const long MB = 1024 * 1024;
    private static readonly Guid BoardId = Guid.NewGuid();
    private static readonly UploadLimitsOptions Limits = new()
    {
        MaxFileBytes = 4 * MB,
        MaxFilesPerBoard = 3,
        MaxBoardFileBytes = 10 * MB,
    };

    private static FakeFileRepository FilesWith(params (string fileId, long size)[] files)
    {
        var repo = new FakeFileRepository();
        repo.ObjectsByPrefix[BoardFileKeys.FilesPrefix(BoardId)] = files
            .Select(f => new StorageObjectInfo(BoardFileKeys.File(BoardId, f.fileId), DateTime.UtcNow, f.size))
            .ToList();
        return repo;
    }

    private static Task<ErrorOr<Success>> Validate(FakeFileRepository repo, string fileId, long size, string mimeType = "image/png") =>
        UploadValidator.ValidateBoardFileAsync(repo, Limits, BoardId, fileId, size, mimeType);

    [Fact]
    public async Task AcceptsValidFile()
    {
        var result = await Validate(FilesWith(), "a1b2c3", 1 * MB);
        Assert.False(result.IsError);
    }

    [Theory]
    [InlineData("../scene.json")]
    [InlineData("a/b")]
    [InlineData("")]
    public async Task RejectsInvalidFileId(string fileId)
    {
        var result = await Validate(FilesWith(), fileId, 1 * MB);
        Assert.Equal(ErrorType.Validation, result.FirstError.Type);
    }

    [Fact]
    public async Task RejectsDisallowedType()
    {
        var result = await Validate(FilesWith(), "abc", 1 * MB, "text/html");
        Assert.Equal(415, result.FirstError.NumericType);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(4 * MB + 1)]
    public async Task RejectsBadSize(long size)
    {
        var result = await Validate(FilesWith(), "abc", size);
        Assert.Equal(413, result.FirstError.NumericType);
    }

    [Fact]
    public async Task RejectsWhenFileCountQuotaReached()
    {
        var result = await Validate(FilesWith(("f1", 1), ("f2", 1), ("f3", 1)), "f4", 1);
        Assert.Equal(ErrorType.Conflict, result.FirstError.Type);
    }

    [Fact]
    public async Task RejectsWhenByteQuotaExceeded()
    {
        var result = await Validate(FilesWith(("f1", 4 * MB), ("f2", 4 * MB)), "f3", 3 * MB);
        Assert.Equal(ErrorType.Conflict, result.FirstError.Type);
    }

    [Fact]
    public async Task ReuploadOfExistingIdDoesNotCountTowardsQuota()
    {
        var result = await Validate(FilesWith(("f1", 4 * MB), ("f2", 4 * MB), ("f3", 2 * MB)), "f3", 2 * MB);
        Assert.False(result.IsError);
    }

    [Fact]
    public void SceneAndThumbnailLimits()
    {
        var limits = new UploadLimitsOptions();
        Assert.False(UploadValidator.ValidateScene(5 * MB, limits).IsError);
        Assert.Equal(413, UploadValidator.ValidateScene(5 * MB + 1, limits).FirstError.NumericType);
        Assert.False(UploadValidator.ValidateThumbnail(MB, "image/webp", limits).IsError);
        Assert.Equal(415, UploadValidator.ValidateThumbnail(MB, "image/gif", limits).FirstError.NumericType);
        Assert.Equal(413, UploadValidator.ValidateThumbnail(MB + 1, "image/png", limits).FirstError.NumericType);
    }
}
