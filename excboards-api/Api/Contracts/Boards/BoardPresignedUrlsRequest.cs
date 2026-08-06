namespace excboards_api.Contracts.Boards;

public record BoardPresignedUrlsRequest(List<Guid> FileIds);