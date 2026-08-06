using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace excboards_api.Contracts.Boards;

public sealed record AddCollaboratorRequest(
    [Required] Guid UserId,
    [Required] PermissionLevel Permission);
