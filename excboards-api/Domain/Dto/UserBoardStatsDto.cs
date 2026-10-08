namespace Domain.Dto;

// public boards only, so the counts reveal nothing about private boards
public class UserBoardStatsDto
{
    public int PublicBoards { get; set; }
    public int LikesReceived { get; set; }
    public int ContributedBoards { get; set; }
}
