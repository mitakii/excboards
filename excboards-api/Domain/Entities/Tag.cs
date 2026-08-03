namespace Domain.Entities;

public class Tag(string name)
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = name;
}