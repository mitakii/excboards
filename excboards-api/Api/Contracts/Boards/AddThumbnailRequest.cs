using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.Boards;

public sealed record AddThumbnailRequest(
    [Range(1, long.MaxValue)] long Size,
    [Required] string MimeType);
