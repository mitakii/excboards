using Domain.Dto;
using Domain.Entities;

namespace Domain.Interfaces;

public interface IBoardCollaboratorRepository
{
    Task<BoardCollaborator?> GetAsync(Guid boardId, Guid userId);
    Task<List<BoardCollaborator>> GetAllAsync(List<Guid> boardIds, Guid userId);
    Task<List<BoardCollaboratorDto>> GetDtosByBoardIdAsync(Guid boardId);
    Task AddAsync(BoardCollaborator collaborator);
    Task UpdateAsync(BoardCollaborator collaborator);
    Task RemoveAsync(BoardCollaborator collaborator);
}
