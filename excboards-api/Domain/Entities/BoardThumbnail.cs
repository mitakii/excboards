namespace Domain.Entities;

public class BoardThumbnail
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public UserBoard Board { get; set; }
    public int Position { get; set; }
    public DateTime Created { get; set; }
}