namespace excboards_api.Contracts.Search;

public record SearchResponse<T>(List<T> Result, int TotalCount, int CurrentPage, int PageSize);