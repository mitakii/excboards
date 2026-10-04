using Application.Dto;
using Application.Interfaces;
using Application.Storage;
using Domain.Entities;
using Domain.Exceptions;
using Domain.Interfaces;
using ErrorOr;

namespace Application.Boards;

public class BoardThumbnailService(IFileRepository fileRepository,
    IThumbnailRepository thumbnailRepository,
    IPermissionService permissionService,
    IBoardRepository boardRepository)
{
    private const int MaxThumbnails = 5;
    public const int MaxBatchBoards = 50;
    private static readonly TimeSpan DownloadUrlExpiry = TimeSpan.FromMinutes(10);

    // add thumbnail to board -> send to user presigned upload url
    public async Task<ErrorOr<BoardThumbnailDto>> AddBoardThumbnailAsync(Guid userId, Guid boardId)
    {
        var permission = await permissionService.SafeCheckEditPermissionAsync(userId, boardId);
        if (permission.IsError)
            return permission.Errors;

        BoardThumbnail boardThumbnail;
        try
        {
            boardThumbnail = await thumbnailRepository.AddNextBoardThumbnailAsync(boardId, MaxThumbnails);
        }
        catch (TooManyThumbnailsException)
        {
            return Error.Conflict("Board.Thumbnails", "Too many thumbnails");
        }

        var uploadUrl = await fileRepository
            .GetUploadUrlAsync(BoardFileKeys.Thumbnail(boardId, boardThumbnail.Id),
            TimeSpan.FromMinutes(10));

        return new BoardThumbnailDto()
        {
            BoardId = boardId,
            UploadUrl = uploadUrl,
            Position = boardThumbnail.Position,
        };
    }
    
    // remove thumbnail -> remove file from repo
    public async Task<ErrorOr<Deleted>> DeleteBoardThumbnailAsync(Guid userId, Guid boardId, int position)
    {
        var permission = await permissionService.SafeCheckEditPermissionAsync(userId, boardId);
        if (permission.IsError)
            return permission.Errors;
        
        var thumbnail = await thumbnailRepository.GetBoardThumbnailAsync(boardId, position);
        if (thumbnail == null)
            return Error.NotFound("Board.Thumbnails", "Thumbnail not found");

        await thumbnailRepository.DeleteBoardThumbnailAsync(thumbnail);
        return Result.Deleted;
    }
    
    
    // list all thumbnails for a board with their presigned download links
    public async Task<ErrorOr<List<BoardThumbnailDto>>> GetBoardThumbnailsAsync(Guid? userId, Guid boardId)
    {
        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.Thumbnails", "Board not found");

        var thumbnails = await thumbnailRepository.GetBoardThumbnailsAsync(boardId);

        var dtos = new List<BoardThumbnailDto>();
        foreach (var thumbnail in thumbnails.OrderBy(t => t.Position))
        {
            var downloadUrl = await fileRepository
                .GetDownloadUrlAsync(BoardFileKeys.Thumbnail(boardId, thumbnail.Id),
                    TimeSpan.FromMinutes(10));

            dtos.Add(new BoardThumbnailDto
            {
                BoardId = boardId,
                Position = thumbnail.Position,
                DownloadUrl = downloadUrl,
            });
        }

        return dtos;
    }

    // thumbnails for many boards at once (board lists), keyed by board id;
    // boards the user can't see or that don't exist are left out
    public async Task<ErrorOr<Dictionary<Guid, List<BoardThumbnailDto>>>> GetThumbnailsForBoardsAsync(
        Guid? userId, List<Guid> boardIds)
    {
        var ids = boardIds.Distinct().ToList();
        if (ids.Count == 0)
            return new Dictionary<Guid, List<BoardThumbnailDto>>();
        if (ids.Count > MaxBatchBoards)
            return Error.Validation("Board.Thumbnails", $"At most {MaxBatchBoards} boards per request.");

        var access = await permissionService.CanViewAsync(userId, ids);
        var visibleIds = access?
            .Where(a => a.Value)
            .Select(a => a.Key)
            .ToList() ?? [];

        var result = visibleIds.ToDictionary(id => id, _ => new List<BoardThumbnailDto>());
        if (visibleIds.Count == 0)
            return result;

        var thumbnails = await thumbnailRepository.GetThumbnailsForBoardsAsync(visibleIds);
        foreach (var thumbnail in thumbnails)
        {
            var downloadUrl = await fileRepository
                .GetDownloadUrlAsync(BoardFileKeys.Thumbnail(thumbnail.BoardId, thumbnail.Id), DownloadUrlExpiry);

            result[thumbnail.BoardId].Add(new BoardThumbnailDto
            {
                BoardId = thumbnail.BoardId,
                Position = thumbnail.Position,
                DownloadUrl = downloadUrl,
            });
        }

        return result;
    }

    // get thumbnail presigned download link
    public async Task<ErrorOr<BoardThumbnailDto>> GetBoardThumbnailAsync(Guid? userId, Guid boardId, int position)
    {
        if (!await permissionService.CanViewAsync(userId, boardId))
            return Error.NotFound("Board.Thumbnails", "Board not found");
        
        var thumbnail = await thumbnailRepository.GetBoardThumbnailAsync(boardId, position);
        if(thumbnail == null)
            return Error.NotFound("Board.Thumbnails", "Thumbnail not found");

        var downloadUrl = await fileRepository
            .GetDownloadUrlAsync(BoardFileKeys.Thumbnail(boardId, thumbnail.Id), 
                TimeSpan.FromMinutes(10));

        return new BoardThumbnailDto()
        {
            BoardId = boardId,
            Position = thumbnail.Position,
            DownloadUrl = downloadUrl,
        };
    }
    
}