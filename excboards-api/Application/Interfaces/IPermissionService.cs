namespace Application.Interfaces;

public interface IPermissionService
{
    Task<bool> CanViewAsync(Guid userId, Guid boardId);
    Task<Dictionary<Guid, bool>?> CanViewAsync(Guid userId, List<Guid> boardIds);
    Task<bool> CanEditAsync(Guid userId, Guid boardId);
    Task<bool> IsOwnerAsync(Guid userId, Guid boardId);
    Task<bool> IsAdminAsync(Guid userId, Guid boardId);
}
