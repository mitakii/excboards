using Domain.Entities;

namespace Domain.Interfaces;

public interface IBoardCollaboratorRepository
{
    Task<BoardCollaborator?> GetAsync(Guid boardId, Guid userId);
    Task AddAsync(BoardCollaborator collaborator);
    Task UpdateAsync(BoardCollaborator collaborator);
    Task RemoveAsync(BoardCollaborator collaborator);
}
