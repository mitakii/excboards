namespace excboards_api.Contracts.Boards;

public record SearchResponse<T>(List<T> Result, int TotalCount, int CurrentPage, int PageSize);