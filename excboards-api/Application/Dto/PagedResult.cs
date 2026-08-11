namespace Application.Dto;

public class PagedResult<T>
{
    public IReadOnlyList<T> Data { get; set; } = null!;
    public int Total { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}