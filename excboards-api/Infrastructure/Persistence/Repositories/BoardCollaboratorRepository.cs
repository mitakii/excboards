using Domain.Dto;
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

    public Task<List<BoardCollaboratorDto>> GetDtosByBoardIdAsync(Guid boardId)
    {
        return context.BoardCollaborators
            .AsNoTracking()
            .Where(c => c.BoardId == boardId)
            .Join(context.Users, c => c.UserId, u => u.Id, (c, u) => 
                new BoardCollaboratorDto
            {
                BoardId = c.BoardId,
                UserId = c.UserId,
                Username = u.UserName!,
                ProfilePictureUrl = u.ProfilePictureUrl,
                Created = c.CreatedAt,
                Permission = c.Permission
            })
            .ToListAsync();
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
