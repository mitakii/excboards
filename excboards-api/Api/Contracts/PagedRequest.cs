namespace excboards_api.Contracts.Boards;

public class PagedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}