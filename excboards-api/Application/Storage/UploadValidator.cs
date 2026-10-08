using System.Text.RegularExpressions;
using Application.Interfaces;
using ErrorOr;

namespace Application.Storage;

public static partial class UploadValidator
{
    public static readonly IReadOnlySet<string> BoardFileTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
    };

    public static readonly IReadOnlySet<string> ThumbnailTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "image/png", "image/jpeg", "image/webp",
    };

    [GeneratedRegex("^[A-Za-z0-9_-]{1,64}$")]
    private static partial Regex FileIdRegex();

    public static ErrorOr<Success> ValidateScene(long size, UploadLimitsOptions limits) =>
        size > limits.MaxSceneBytes
            ? UploadErrors.TooLarge("Board.SceneTooLarge", "Board scene", limits.MaxSceneBytes)
            : Result.Success;

    public static ErrorOr<Success> ValidateThumbnail(long size, string mimeType, UploadLimitsOptions limits)
    {
        if (!ThumbnailTypes.Contains(mimeType))
            return UploadErrors.UnsupportedType("Board.ThumbnailType", mimeType);
        if (size <= 0 || size > limits.MaxThumbnailBytes)
            return UploadErrors.TooLarge("Board.ThumbnailTooLarge", "Thumbnail", limits.MaxThumbnailBytes);
        return Result.Success;
    }

    public static async Task<ErrorOr<Success>> ValidateBoardFileAsync(
        IFileRepository fileRepository, UploadLimitsOptions limits,
        Guid boardId, string fileId, long size, string mimeType)
    {
        if (!FileIdRegex().IsMatch(fileId))
            return Error.Validation("Board.FileId", "Invalid file id.");
        if (!BoardFileTypes.Contains(mimeType))
            return UploadErrors.UnsupportedType("Board.FileType", mimeType);
        if (size <= 0 || size > limits.MaxFileBytes)
            return UploadErrors.TooLarge("Board.FileTooLarge", "File", limits.MaxFileBytes);

        var stored = await fileRepository.ListObjectsAsync(BoardFileKeys.FilesPrefix(boardId));
        var key = BoardFileKeys.File(boardId, fileId);

        var others = stored.Where(o => o.Key != key).ToList();
        if (others.Count >= limits.MaxFilesPerBoard)
            return Error.Conflict("Board.StorageQuota",
                $"This board already has the maximum of {limits.MaxFilesPerBoard} files.");
        if (others.Sum(o => o.Size) + size > limits.MaxBoardFileBytes)
            return Error.Conflict("Board.StorageQuota",
                $"This board has reached its {limits.MaxBoardFileBytes / 1024 / 1024} MB storage limit.");

        return Result.Success;
    }
}

public static class UploadErrors
{
    public static Error TooLarge(string code, string what, long maxBytes) =>
        Error.Custom(413, code, $"{what} is too large. Maximum allowed size is {maxBytes / 1024 / 1024} MB.");

    public static Error UnsupportedType(string code, string mimeType) =>
        Error.Custom(415, code, $"File type \"{mimeType}\" is not allowed.");
}
