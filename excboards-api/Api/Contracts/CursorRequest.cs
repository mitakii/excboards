namespace excboards_api.Contracts;

public class CursorRequest
{
    public string? Cursor { get; set; }
    public int PageSize { get; set; } = 10;
}
