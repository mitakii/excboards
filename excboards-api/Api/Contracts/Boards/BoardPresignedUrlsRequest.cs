namespace excboards_api.Contracts.Boards;

public sealed record BoardPresignedUrlsRequest(List<string> FileIds);