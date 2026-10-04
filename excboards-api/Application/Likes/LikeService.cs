using Application.Interfaces;
using Domain.Dto;
using Domain.Interfaces;
using ErrorOr;

namespace Application.Likes;

public class LikeService(ILikeRepository likeRepository, IPermissionService permissionService)
{
    public async Task<ErrorOr<BoardLikeStateDto>> LikeAsync(Guid userId, Guid boardId)
    {
        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        await likeRepository.LikeBoardAsync(boardId, userId);
        return new BoardLikeStateDto(await likeRepository.GetBoardLikesAsync(boardId), true);
    }

    public async Task<ErrorOr<BoardLikeStateDto>> UnlikeAsync(Guid userId, Guid boardId)
    {
        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        await likeRepository.UnlikeBoardAsync(boardId, userId);
        return new BoardLikeStateDto(await likeRepository.GetBoardLikesAsync(boardId), false);
    }
}
