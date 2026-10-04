namespace excboards_api.Contracts;

public record PagedResponse<T>(List<T> Result, int TotalCount, int CurrentPage, int PageSize);