namespace Domain.Dto;

public class BookmarkedBoardDto
{
    public Guid BoardId { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public bool IsPublished { get; set; }
    public int LikesCount { get; set; }
    public bool IsLiked { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime BookmarkedAt { get; set; }
    public List<TagDto> Tags { get; set; } = new();
}
