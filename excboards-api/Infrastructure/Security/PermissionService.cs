using Application.Interfaces;
using Domain.Enums;
using ErrorOr;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Security;

public class PermissionService(AppDbContext context) : IPermissionService
{
    private readonly record struct AccessResult(bool IsOwner, PermissionLevel? CollaboratorPermission);

    public async Task<bool> UserWorldBoardIsBannedAsync(Guid userId)
    {
        var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(b => b.Id == userId);
        if(user is null or {IsBanned:false}) return false;
        return true;
    }

    public Task<bool> WorldBoardExistsAsync(Guid boardId)
        => context.WorldBoards.AsNoTracking().AnyAsync(b => b.Id == boardId);

    public async Task<bool> CanEditWorldBoardAsync(Guid userId, Guid boardId)
    {
        var board = await context.WorldBoards.AsNoTracking().FirstOrDefaultAsync(b => b.Id == boardId);
        if (board is null || board.IsArchived(DateTime.UtcNow))
            return false;
        return !await UserWorldBoardIsBannedAsync(userId);
    }

    public async Task<bool> CanViewAsync(Guid? userId, Guid boardId)
    {
        if(await BoardIsPublicAsync(boardId))
            return true;
        if (userId is not { } id)
            return false;
        return await GetAccessAsync(id, boardId) is not null;
    }
    

    public async Task<Dictionary<Guid, bool>?> CanViewAsync(Guid? userId, List<Guid> boardIds) =>
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
    
    public async Task<ErrorOr<bool>> SafeCheckEditPermissionAsync(Guid userId, Guid boardId)
    {
        if(!await CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await CanEditAsync(userId, boardId))
            return Error.Forbidden("Board.Forbidden", "You do not have permission to edit this board.");

        return true;
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
    
    private async Task<Dictionary<Guid, bool>?> GetViewAccessAsync(Guid? userId, List<Guid> boardIds)
    {
        var result = await context.UserBoards
            .AsNoTracking()
            .Where(b => boardIds.Contains(b.Id))
            .Select(b => new {
                b.Id,
                Permission = b.IsPublished
                             || b.UserId == userId
                             || b.Collaborators.Any(c => c.UserId == userId)})
            .ToDictionaryAsync(b => b.Id, b => b.Permission);

        return result;
    }
}
