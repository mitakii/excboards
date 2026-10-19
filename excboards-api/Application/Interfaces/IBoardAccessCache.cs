namespace Application.Interfaces;

public interface IBoardAccessCache
{
    Task InvalidateBoardAsync(Guid boardId);
}