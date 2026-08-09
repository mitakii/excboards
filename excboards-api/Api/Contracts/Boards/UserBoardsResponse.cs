namespace excboards_api.Contracts.Boards;

public class UserBoardsResponse
{
    public IList<BoardResponse> Boards { get; set; } = new List<BoardResponse>();
    public Guid RequestUserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}