namespace excboards_api.Contracts.Boards;

public record BoardThumbnailResponse(Guid BoardId, int Position, string PresignedUrl);