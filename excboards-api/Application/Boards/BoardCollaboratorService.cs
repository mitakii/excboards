using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using ErrorOr;

namespace Application.Boards;

public class BoardCollaboratorService(
    IBoardRepository boardRepository,
    IBoardCollaboratorRepository collaboratorRepository,
    IPermissionService permissionService,
    IUserService userService)
{
    public async Task<ErrorOr<Updated>> AddAsync
        (Guid requestingUserId, Guid boardId, Guid targetUserId, PermissionLevel permission)
    {
        var authError = await AuthorizeOwnerAsync(requestingUserId, boardId);
        if (authError is not null)
            return authError.Value;

        if (targetUserId == requestingUserId)
            return Error
                .Validation("Collaborator.SelfInvite", "The board owner already has full access.");

        var targetUser = await userService.GetUserByIdAsync(targetUserId);
        if (targetUser.IsError)
            return Error.NotFound("User.NotFound", "User not found");

        if (await collaboratorRepository.GetAsync(boardId, targetUserId) is not null)
            return Error
                .Conflict("Collaborator.AlreadyExists", "This user is already a collaborator.");

        await collaboratorRepository.AddAsync(new BoardCollaborator
        {
            Id = Guid.NewGuid(),
            BoardId = boardId,
            UserId = targetUserId,
            Permission = permission,
            CreatedAt = DateTime.UtcNow,
        });

        return Result.Updated;
    }

    public async Task<ErrorOr<Updated>> UpdateAsync
        (Guid requestingUserId, Guid boardId, Guid targetUserId, PermissionLevel permission)
    {
        var authError = await AuthorizeOwnerAsync(requestingUserId, boardId);
        if (authError is not null)
            return authError.Value;

        var collaborator = await collaboratorRepository.GetAsync(boardId, targetUserId);
        if (collaborator is null)
            return Error.NotFound("Collaborator.NotFound", "Collaborator not found");

        collaborator.Permission = permission;
        await collaboratorRepository.UpdateAsync(collaborator);
        return Result.Updated;
    }

    public async Task<ErrorOr<Deleted>> RemoveAsync(Guid requestingUserId, Guid boardId, Guid targetUserId)
    {
        var authError = await AuthorizeOwnerAsync(requestingUserId, boardId);
        if (authError is not null)
            return authError.Value;

        var collaborator = await collaboratorRepository.GetAsync(boardId, targetUserId);
        if (collaborator is null)
            return Error.NotFound("Collaborator.NotFound", "Collaborator not found");

        await collaboratorRepository.RemoveAsync(collaborator);
        return Result.Deleted;
    }

    private async Task<Error?> AuthorizeOwnerAsync(Guid requestingUserId, Guid boardId)
    {
        var board = await boardRepository.GetByIdAsync(boardId);
        if (board is null)
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.CanViewAsync(requestingUserId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.IsOwnerAsync(requestingUserId, boardId))
            return Error.Forbidden("Board.Forbidden", "Only the board owner can manage collaborators.");

        return null;
    }
}
