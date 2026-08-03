namespace Domain.Exceptions;

public class DuplicateBoardNameException(Guid userId, string name)
    : Exception($"A board named '{name}' already exists for user {userId}.")
{
    public Guid UserId { get; } = userId;
    public string Name { get; } = name;
}
