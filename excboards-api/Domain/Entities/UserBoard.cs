namespace Domain.Entities;

public class UserBoard
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public bool IsPublished { get; set; }
    public DateTime Created { get; set; }
    public DateTime Updated { get; set; }
    
    public string Name { get; set; }
    public string Description { get; set; }
    
    public ICollection<Tag> Tags { get; set; } =  new List<Tag>();
    public ICollection<BoardCollaborator> Collaborators { get; set; } = new List<BoardCollaborator>();
}
