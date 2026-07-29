namespace Domain.Entities;

public class BoardCollaborator
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }

    public UserBoard Board { get; set; }
}
