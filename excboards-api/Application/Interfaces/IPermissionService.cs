using ErrorOr;

namespace Application.Interfaces;

public interface IPermissionService
{
    Task<bool> UserWorldBoardIsBannedAsync(Guid userId);
    Task<bool> WorldBoardExistsAsync(Guid boardId);
    Task<bool> CanEditWorldBoardAsync(Guid userId, Guid boardId);
    // userId null = anonymous viewer, published boards only
    Task<bool> CanViewAsync(Guid? userId, Guid boardId);
    Task<Dictionary<Guid, bool>?> CanViewAsync(Guid? userId, List<Guid> boardIds);
    Task<bool> CanEditAsync(Guid userId, Guid boardId);
    Task<bool> IsOwnerAsync(Guid userId, Guid boardId);
    Task<bool> IsAdminAsync(Guid userId, Guid boardId);
    Task<ErrorOr<bool>> SafeCheckEditPermissionAsync(Guid userId, Guid boardId);
}
