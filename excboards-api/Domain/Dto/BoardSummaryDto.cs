namespace Domain.Dto;

public class BoardSummaryDto
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public bool IsPublished { get; set; }
    public DateTime Created { get; set; }
    public DateTime Updated { get; set; }
    public int LikesCount { get; set; }
    // null when the viewer is anonymous
    public bool? IsLiked { get; set; }
    public bool? IsBookmarked { get; set; }

    public List<TagDto> Tags { get; set; } = new();
}
