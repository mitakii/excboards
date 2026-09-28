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
    public async Task<ErrorOr<List<BoardThumbnailDto>>> GetBoardThumbnailsAsync(Guid userId, Guid boardId)
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

    // get thumbnail presigned download link
    public async Task<ErrorOr<BoardThumbnailDto>> GetBoardThumbnailAsync(Guid userId, Guid boardId, int position)
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