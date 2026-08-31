using Application.Interfaces;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Security;

public class PermissionService(AppDbContext context) : IPermissionService
{
    private readonly record struct AccessResult(bool IsOwner, PermissionLevel? CollaboratorPermission);

    public async Task<bool> CanViewAsync(Guid userId, Guid boardId)
    {
        if(await BoardIsPublicAsync(boardId))
            return true;
        return await GetAccessAsync(userId, boardId) is not null;
    }

    public async Task<Dictionary<Guid, bool>?> CanViewAsync(Guid userId, List<Guid> boardIds) =>
        await GetViewAccessAsync(userId, boardIds);

    public async Task<bool> CanEditAsync(Guid userId, Guid boardId)
    {
        var access = await GetAccessAsync(userId, boardId);
        return access is { IsOwner: true } or { CollaboratorPermission: PermissionLevel.Editor or PermissionLevel.Admin};
    }

    public Task<bool> IsOwnerAsync(Guid userId, Guid boardId)
        => context.UserBoards.AsNoTracking().AnyAsync(b => b.Id == boardId && b.UserId == userId);

    public async Task<bool> IsAdminAsync(Guid userId, Guid boardId)
    {
        var access = await GetAccessAsync(userId, boardId);
        return access is { IsOwner: true } or { CollaboratorPermission: PermissionLevel.Admin };
    }

    private async Task<bool> BoardIsPublicAsync(Guid boardId)
    {
        var result = await context.UserBoards.AsNoTracking().Where(b => b.Id == boardId).FirstOrDefaultAsync();
        return result is not null && result.IsPublished;
    }
    
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
    
    private async Task<Dictionary<Guid, bool>?> GetViewAccessAsync(Guid userId, List<Guid> boardIds)
    {
        var result = await context.UserBoards
            .AsNoTracking()
            .Where(b => boardIds.Contains(b.Id))
            .Select(b => new {
                b.Id,
                Permission = b.IsPublished || b.Collaborators
                    .Any(c => c.UserId == userId)})
            .ToDictionaryAsync(b => b.Id, b => b.Permission);

        return result;
    }
}
