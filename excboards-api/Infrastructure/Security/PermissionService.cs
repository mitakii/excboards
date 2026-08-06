using Application.Interfaces;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Security;

public class PermissionService(AppDbContext context) : IPermissionService
{
    private readonly record struct AccessResult(bool IsOwner, PermissionLevel? CollaboratorPermission);

    public async Task<bool> CanViewAsync(Guid userId, Guid boardId)
        => await GetAccessAsync(userId, boardId) is not null;

    public async Task<bool> CanEditAsync(Guid userId, Guid boardId)
    {
        var access = await GetAccessAsync(userId, boardId);
        return access is { IsOwner: true } or { CollaboratorPermission: PermissionLevel.Editor };
    }

    public Task<bool> IsOwnerAsync(Guid userId, Guid boardId)
        => context.UserBoards.AsNoTracking().AnyAsync(b => b.Id == boardId && b.UserId == userId);

    private async Task<AccessResult?> GetAccessAsync(Guid userId, Guid boardId)
    {
        var result = await context.UserBoards
            .AsNoTracking()
            .Where(b => b.Id == boardId)
            .Select(b => new AccessResult(
                b.UserId == userId,
                b.Collaborators
                    .Where(c => c.UserId == userId)
                    .Select(c => (PermissionLevel?)c.Permission)
                    .FirstOrDefault()))
            .Cast<AccessResult?>()
            .FirstOrDefaultAsync();

        if (result is null) return null;
        if (result.Value is { IsOwner: false, CollaboratorPermission: null }) return null;
        return result;
    }
}
