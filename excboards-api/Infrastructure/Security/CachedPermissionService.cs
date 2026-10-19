using Application.Interfaces;
using Domain.Entities;
using ErrorOr;
using Microsoft.Extensions.Caching.Hybrid;

namespace Infrastructure.Security;

public class CachedPermissionService(PermissionService inner, HybridCache cache) : IPermissionService, IBoardAccessCache
{
    private static string BoardKey(Guid boardId) => $"perm:board:{boardId}";
    private static string WorldBoardKey(Guid boardId) => $"perm:wb:{boardId}";

    private ValueTask<BoardAccess?> GetBoardAccessAsync(Guid boardId) =>
        cache.GetOrCreateAsync(BoardKey(boardId), (inner, boardId),
            static async (s,ct) => await s.inner.LoadBoardAccessAsync(s.boardId));

    private ValueTask<WorldBoard?> GetWorldBoardAsync(Guid boardId) =>
        cache.GetOrCreateAsync(WorldBoardKey(boardId), (inner, boardId),
            static async (s, ct) => await s.inner.LoadWorldBoardAsync(s.boardId));
    
    public Task<bool> UserWorldBoardIsBannedAsync(Guid userId) =>
        inner.UserWorldBoardIsBannedAsync(userId);

    public async Task<bool> WorldBoardExistsAsync(Guid boardId) =>
        await GetWorldBoardAsync(boardId) is not null;

    public async Task<bool> CanEditWorldBoardAsync(Guid userId, Guid boardId)
    {
        var board = await GetWorldBoardAsync(boardId);
        if (board is null || board.IsArchived(DateTime.UtcNow))
            return false;
        return !await inner.UserWorldBoardIsBannedAsync(userId);
    }

    public async Task<bool> CanViewAsync(Guid? userId, Guid boardId) =>
        await GetBoardAccessAsync(boardId) is { } access && access.CanView(userId);

    public Task<Dictionary<Guid, bool>?> CanViewAsync(Guid? userId, List<Guid> boardIds) =>
        inner.CanViewAsync(userId, boardIds);

    public async Task<bool> CanEditAsync(Guid userId, Guid boardId) =>
        await GetBoardAccessAsync(boardId) is { } access && access.CanEdit(userId);

    public async Task<bool> IsOwnerAsync(Guid userId, Guid boardId) =>
        await GetBoardAccessAsync(boardId) is { } access && access.IsOwner(userId);

    public async Task<bool> IsAdminAsync(Guid userId, Guid boardId) =>
        await GetBoardAccessAsync(boardId) is { } access && access.IsAdmin(userId);

    public async Task<ErrorOr<bool>> SafeCheckEditPermissionAsync(Guid userId, Guid boardId)
    {
        var access = await GetBoardAccessAsync(boardId);
        if (access is null || !access.CanView(userId))
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!access.CanEdit(userId))
            return Error.Forbidden("Board.Forbidden", "You do not have permission to edit this board.");

        return true;
    }

    public Task InvalidateBoardAsync(Guid boardId) =>
        cache.RemoveAsync([BoardKey(boardId), WorldBoardKey(boardId)]).AsTask();
}
