namespace Application.Interfaces;

public interface IPermissionService
{
    Task<bool> CanViewAsync(Guid userId, Guid boardId);
    Task<bool> CanEditAsync(Guid userId, Guid boardId);
    Task<bool> IsOwnerAsync(Guid userId, Guid boardId);
}
