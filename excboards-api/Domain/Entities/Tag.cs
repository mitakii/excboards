namespace Domain.Entities;

public class Tag(string tagName)
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = tagName;
}