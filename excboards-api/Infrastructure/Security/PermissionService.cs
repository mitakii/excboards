using Application.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Security;

public class PermissionService(AppDbContext context) : IPermissionService
{
    public async Task<bool> CanAccessRoomAsync(Guid userId, Guid roomId)
    {
        return await context.UserBoards
            .Where(b => b.Id == roomId)
            .Where(b => b.UserId == userId || b.Collaborators.Any(c => c.UserId == userId))
            .AnyAsync();
    }
}
