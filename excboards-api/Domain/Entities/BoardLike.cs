namespace Domain.Entities;

public class BoardLike
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid BoardId { get; set; }
    public DateTime CreatedAt { get; set; }
    
}