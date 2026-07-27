namespace Application.Interfaces;

public interface IPermissionService
{
    Task<bool> CanAccessRoomAsync(Guid userId, Guid roomId, CancellationToken cancellationToken = default);
}
