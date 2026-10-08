namespace excboards_api.Contracts;

/// <param name="NextCursor">Null when there are no more items.</param>
/// <param name="TotalCount">Only set on the first page (no cursor in the request).</param>
public record CursorResponse<T>(List<T> Result, string? NextCursor, int? TotalCount);
