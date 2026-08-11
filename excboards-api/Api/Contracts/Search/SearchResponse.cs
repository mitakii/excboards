namespace excboards_api.Contracts.Boards;

public record SearchResponse<T>(List<T> result, int TotalCount, int CurrentPage, int PageSize);