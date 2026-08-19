using System.Net;
using Application.Dto;
using Application.Interfaces;
using Application.Mappers;
using Application.Storage;
using Domain.Entities;
using Domain.Exceptions;
using Domain.Interfaces;
using ErrorOr;

namespace Application.Boards;

public class BoardService(IBoardRepository boardRepository, 
    IFileRepository fileRepository,
    IPermissionService permissionService,
    ITagRepository tagRepository)
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
        
        await fileRepository.UploadFileAsync(BoardFileKeys.Scene(board.Id), stream);

        try
        {
            await boardRepository.AddAsync(board);
        }
        catch (DuplicateBoardNameException)
        {
            return Error.Validation("Board.DuplicateName", "A board with this name already exists.");
        }

        return board.Id;
    }

    public async Task<ErrorOr<PagedResult<UserBoardDto>>> SearchAsync(Guid userId, string query, int page = 1, int pageSize = 10)
    {
        if(string.IsNullOrWhiteSpace(query))
            return Error.Validation("Board.SearchQuery", "Search query is required.");
        
        var boards = await boardRepository.SearchAsync(userId, query, page, pageSize);
        
        return new PagedResult<UserBoardDto>()
        {
            Data = boards.MapToDto(),
            Page = page,
            PageSize = pageSize,
            Total = boards.Count
        };
    }

    public async Task<ErrorOr<UserBoardDto>> GetByIdAsync(Guid userId, Guid boardId)
    {
        var board = await boardRepository.GetByIdAsync(boardId);
        if (board == null)
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        return board.MapToDto();
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

    public async Task<ErrorOr<Updated>> SaveSceneAsync(Guid userId, Guid boardId, Stream stream)
    {
        var board = await boardRepository.GetByIdAsync(boardId);
        if (board == null)
            return Error.NotFound("Board.NotFound", "Board not found");
        
        var permission = await SafeCheckEditPermissionAsync(userId, board);
        if (permission.IsError)
            return permission.Errors;

        await fileRepository.UploadFileAsync(BoardFileKeys.Scene(boardId), stream);

        board!.Updated = DateTime.UtcNow;
        await boardRepository.UpdateAsync(board);

        return Result.Updated;
    }
    
    public async Task<ErrorOr<Updated>> UpdateBoardAsync(Guid userId, Guid boardId, UserBoardUpdateDto dto)
    {
        var board = await boardRepository.GetByIdAsync(boardId);
        if (board == null)
            return Error.NotFound("Board.NotFound", "Board not found");
        
        var permission = await SafeCheckEditPermissionAsync(userId, board);
        if(permission.IsError)
            return permission.Errors;
        
        board.Description = string.IsNullOrWhiteSpace(dto.Description) ? board.Description : dto.Description;
        board.Name = string.IsNullOrWhiteSpace(dto.Name) ? board.Name : dto.Name;
        if (dto.Tags.Count > 0)
            board.Tags = await tagRepository.CreateTagsAsync(dto.Tags);
        
        await boardRepository.UpdateAsync(board);
        return Result.Updated;
    }

    public async Task<ErrorOr<Deleted>> RemoveAsync(Guid userId, Guid boardId)
    {
        var board = await boardRepository.GetByIdAsync(boardId);
        
        var permission = await SafeCheckEditPermissionAsync(userId, board);
        if (permission.IsError)
            return permission.Errors;

        await boardRepository.RemoveAsync(board);

        return Result.Deleted;
    }

    public async Task<ErrorOr<Updated>> AddTagsAsync(Guid userId, Guid boardId, List<Tag> tags)
    {
        var board = await boardRepository.GetByIdAsync(boardId);

        var permission = await SafeCheckEditPermissionAsync(userId, board);
        if (permission.IsError)
            return permission.Errors;

        board!.Tags = tags;
        board.Updated = DateTime.UtcNow;

        await boardRepository.UpdateAsync(board);
        return Result.Updated;
    }

    public async Task<ErrorOr<Updated>> RemoveTagsAsync(Guid userId, Guid boardId, List<Tag> tagsToRemove)
    {
        var board = await boardRepository.GetByIdAsync(boardId);

        var permission = await SafeCheckEditPermissionAsync(userId, board);
        if (permission.IsError)
            return permission.Errors;

        board!.Tags = board.Tags.Except(tagsToRemove).ToList();
        board.Updated = DateTime.UtcNow;

        await boardRepository.UpdateAsync(board);
        return Result.Updated;
    }

    private async Task<ErrorOr<bool>> SafeCheckEditPermissionAsync(Guid userId, UserBoard? board)
    {
        if(board == null || !await permissionService.CanViewAsync(userId, board.Id))
            return Error.NotFound("Board.NotFound", "Board not found");

        if (!await permissionService.CanEditAsync(userId, board.Id))
            return Error.Forbidden("Board.Forbidden", "You do not have permission to edit this board.");

        return true;
    }

    public async Task<ErrorOr<List<UserBoardDto>?>> GetUserBoards(Guid requestUserId, Guid currentUserId, int pageNumber, int pageSize)
    {
        var userBoards = await boardRepository
            .GetAllByUserIdPagedAsync(requestUserId, currentUserId, pageNumber, pageSize);
        
        if(userBoards.Count == 0)
            return Error.NotFound("Board.NotFound", "Board not found");
        
        return userBoards.MapToDto();
    }

    public async Task<ErrorOr<Dictionary<string, string>>> GetDownloadPresignedUrls(Guid userId, Guid boardId, List<string> sceneFileIds)
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

    public async Task<ErrorOr<string>> GetDownloadPresignedUrl(Guid userId, Guid boardId, string fileId)
    {
        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.NotFound", "Board not found");

        var result = await fileRepository
            .GetDownloadUrlAsync(BoardFileKeys.File(boardId, fileId), TimeSpan.FromMinutes(10));
        return result;
    }

    public async Task<ErrorOr<string>> GetUploadPresignedUrl(Guid userId, Guid boardId, string fileId)
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
