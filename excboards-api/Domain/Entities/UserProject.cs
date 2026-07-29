namespace Domain.Entities;

public class UserProject
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public ICollection<UserBoard> UserBoards { get; set; } = new List<UserBoard>();
    
    public string Name { get; set; }
    public string Description { get; set; }
    
    public bool IsPublished { get; set; }

}