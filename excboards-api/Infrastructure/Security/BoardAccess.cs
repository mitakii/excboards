using Domain.Enums;

namespace Infrastructure.Security;

// Cached snapshot of who can access a user board. Same rules as PermissionService.
public sealed record BoardAccess(Guid OwnerId, bool IsPublished, Dictionary<Guid, PermissionLevel> Collaborators)
{
    public bool IsOwner(Guid userId) => OwnerId == userId;

    public bool CanView(Guid? userId) =>
        IsPublished || userId is { } id && (IsOwner(id) || Collaborators.ContainsKey(id));

    public bool CanEdit(Guid userId) =>
        IsOwner(userId)
        || Collaborators.GetValueOrDefault(userId) is PermissionLevel.Editor or PermissionLevel.Admin;

    public bool IsAdmin(Guid userId) =>
        IsOwner(userId) || Collaborators.GetValueOrDefault(userId) is PermissionLevel.Admin;
}
