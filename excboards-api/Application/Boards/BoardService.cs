using System.Net;
using Application.Dto;
using Application.Interfaces;
using Application.Storage;
using Domain.Entities;
using Domain.Exceptions;
using Domain.Interfaces;
using ErrorOr;

namespace Application.Boards;

public class BoardService(IBoardRepository boardRepository, IFileRepository fileRepository, IPermissionService permissionService)
{
    public async Task<ErrorOr<Guid>> CreateAsync(Guid userId, string name, string description, Stream stream)
    {
        if (await boardRepository.ExistsByNameAsync(userId, name))
            return Error.Validation("Board.DuplicateName", "A board with this name already exists.");

        var now = DateTime.UtcNow;

        var board = new UserBoard
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name,
            NormalizedName = name.ToLower(),
            Description = description,
            IsPublished = false,
            Created = now,
            Updated = now,
        };

        try
        {
            await boardRepository.AddAsync(board);
        }
        catch (DuplicateBoardNameException)
        {
            return Error.Validation("Board.DuplicateName", "A board with this name already exists.");
        }

        await fileRepository.UploadFileAsync(BoardFileKeys.Scene(board.Id), stream);
        return board.Id;
    }

    public async Task<ErrorOr<UserBoard>> GetByIdAsync(Guid userId, Guid boardId)
    {
        var board = await boardRepository.GetByIdAsync(boardId);
        if (board == null)
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        return board;
    }

    public async Task<ErrorOr<Stream>> GetSceneAsync(Guid userId, Guid boardId)
    {
        var board = await boardRepository.GetByIdAsync(boardId);
        if (board == null)
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        return await fileRepository.GetFileAsync(BoardFileKeys.Scene(boardId));
    }

    public async Task<ErrorOr<Deleted>> RemoveAsync(Guid userId, Guid boardId)
    {
        var board = await boardRepository.GetByIdAsync(boardId);
        if (board == null)
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.IsOwnerAsync(userId, boardId))
            return Error.Forbidden("Board.Forbidden", "Only the board owner can delete this board.");

        await boardRepository.RemoveAsync(board);

        return Result.Deleted;
    }

    public async Task<ErrorOr<Updated>> AddTagsAsync(Guid userId, Guid boardId, List<Tag> tags)
    {
        var board = await boardRepository.GetByIdAsync(boardId);

        if(board == null)
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.CanEditAsync(userId, boardId))
            return Error.Forbidden("Board.Forbidden", "You do not have permission to edit this board.");

        board.Tags = tags;
        board.Updated = DateTime.UtcNow;

        await boardRepository.UpdateAsync(board);
        return Result.Updated;
    }

    public async Task<ErrorOr<Updated>> RemoveTagsAsync(Guid userId, Guid boardId, List<Tag> tagsToRemove)
    {
        var board = await boardRepository.GetByIdAsync(boardId);

        if(board == null)
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.CanEditAsync(userId, boardId))
            return Error.Forbidden("Board.Forbidden", "You do not have permission to edit this board.");

        board.Tags = board.Tags.Except(tagsToRemove).ToList();
        board.Updated = DateTime.UtcNow;

        await boardRepository.UpdateAsync(board);
        return Result.Updated;
    }

    public async Task<ErrorOr<List<UserBoard>>> GetUserBoards(Guid userId, int pageNumber, int pageSize)
    {
        return await boardRepository
            .GetAllByUserIdPagedAsync(userId, pageNumber, pageSize);
    }

    public async Task<ErrorOr<Dictionary<Guid, string>>> GetDownloadPresignedUrls(Guid userId, Guid boardId, List<Guid> sceneFileIds)
    {
        if(!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        var result = await Task.WhenAll(sceneFileIds.Select(async fId => (
                FileId: fId,
                FileUrl: await fileRepository.GetDownloadUrlAsync(
                        BoardFileKeys.File(boardId, fId), TimeSpan.FromMinutes(10)))
        ));

        return result.ToDictionary(k => k.FileId, v => v.FileUrl);
    }
    
    public async Task<ErrorOr<string>> GetDownloadPresignedUrl(Guid userId, Guid boardId, Guid fileId)
    {
        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        var result = await fileRepository
            .GetDownloadUrlAsync(BoardFileKeys.File(boardId, fileId), TimeSpan.FromMinutes(10));
        return result;
    }

    public async Task<ErrorOr<string>> GetUploadPresignedUrl(Guid userId, Guid boardId, Guid fileId)
    {
        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");
        if (!await permissionService.CanEditAsync(userId, boardId))
            return Error.Forbidden("Board.Forbidden", "User cant edit board");

        var result = await fileRepository
            .GetUploadUrlAsync(BoardFileKeys.File(boardId, fileId), TimeSpan.FromMinutes(10));
        return result;
    }
}
