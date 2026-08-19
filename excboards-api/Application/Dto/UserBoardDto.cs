namespace Application.Dto;

public class UserBoardDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public bool IsPublished { get; set; }
    public DateTime Created { get; set; }
    public DateTime Updated { get; set; }
    
    public string Name { get; set; }
    public string Description { get; set; }
    
    public List<TagDto> Tags { get; set; } =  new List<TagDto>();
}