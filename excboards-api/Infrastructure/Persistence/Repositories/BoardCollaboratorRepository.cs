using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class BoardCollaboratorRepository(AppDbContext context) : IBoardCollaboratorRepository
{
    public Task<BoardCollaborator?> GetAsync(Guid boardId, Guid userId)
    {
        return context.BoardCollaborators
            .FirstOrDefaultAsync(c => c.BoardId == boardId && c.UserId == userId);
    }

    public Task<List<BoardCollaborator>> GetAllAsync(List<Guid> boardIds, Guid userId)
    {
        return context.BoardCollaborators
            .Where(c => boardIds.Contains(c.BoardId) && c.UserId == userId)
            .ToListAsync();
    }

    public Task<List<BoardCollaborator>> GetAllByBoardIdAsync(Guid boardId)
    {
        return context.BoardCollaborators.Where(c => c.BoardId == boardId).ToListAsync();
    }

    public Task AddAsync(BoardCollaborator collaborator)
    {
        context.BoardCollaborators.Add(collaborator);
        return context.SaveChangesAsync();
    }

    public Task UpdateAsync(BoardCollaborator collaborator)
    {
        context.BoardCollaborators.Update(collaborator);
        return context.SaveChangesAsync();
    }

    public Task RemoveAsync(BoardCollaborator collaborator)
    {
        context.BoardCollaborators.Remove(collaborator);
        return context.SaveChangesAsync();
    }
}
