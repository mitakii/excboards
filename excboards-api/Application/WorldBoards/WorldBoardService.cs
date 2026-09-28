using System.Text;
using Application.Dto;
using Application.Interfaces;
using Application.Storage;
using Domain.Dto;
using Domain.Interfaces;
using Domain.Entities;
using ErrorOr;

namespace Application.WorldBoards;

public class WorldBoardService(
    IWorldBoardRepository wbRepository,
    IFileRepository fileRepository,
    IPermissionService permissionService)
{
    private static readonly byte[] EmptySceneJson = Encoding.UTF8.GetBytes(
        """{"type":"excalidraw","version":2,"source":"excboards","elements":[],"appState":{},"files":{}}""");

    private static WorldBoardDto ToDto(WorldBoard board) =>
        new(board.Id, board.CreatedAt, board.IsArchived(DateTime.UtcNow));

    //create
    public async Task<ErrorOr<Guid>> CreateAsync(Stream stream)
    {
        var board = new WorldBoard()
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow),
        };

        await ArchiveLatestAsync();
        await wbRepository.AddAsync(board);

        await fileRepository.UploadFileAsync(BoardFileKeys.Scene(board.Id), stream);

        return board.Id;
    }

    //delete
    public async Task<ErrorOr<Guid>> DeleteAsync(Guid id)
    {
        var board = await wbRepository.GetByIdAsync(id);
        if (board == null)
            return Error.NotFound($"Board with id {id} not found.");
        await wbRepository.DeleteAsync(board);
        return board.Id;
    }

    // Board of the current month; rolls over lazily — the first request of a new
    // month archives the previous board and starts an empty one.
    public async Task<ErrorOr<WorldBoardDto>> GetOrCreateCurrentAsync()
    {
        var monthStart = WorldBoard.MonthStart(DateTime.UtcNow);

        var latest = await wbRepository.GetLatestByDateAsync();
        if (latest is not null && latest.CreatedAt >= monthStart)
            return ToDto(latest);

        await ArchiveLatestAsync();

        var board = new WorldBoard
        {
            Id = Guid.NewGuid(),
            CreatedAt = monthStart,
        };

        // Scene first, so the row never exists without a scene to load.
        await using (var empty = new MemoryStream(EmptySceneJson))
            await fileRepository.UploadFileAsync(BoardFileKeys.Scene(board.Id), empty);

        if (await wbRepository.TryAddAsync(board))
            return ToDto(board);

        // A concurrent request created this month's board first.
        await fileRepository.DeleteFileAsync(BoardFileKeys.Scene(board.Id));
        latest = await wbRepository.GetLatestByDateAsync();
        if (latest is null)
            return Error.Unexpected("WorldBoard.Create", "Failed to create the world board.");
        return ToDto(latest);
    }

    private async Task ArchiveLatestAsync()
    {
        var latest = await wbRepository.GetLatestByDateAsync();
        if (latest is null or { IsReadOnly: true })
            return;

        latest.IsReadOnly = true;
        await wbRepository.UpdateAsync(latest);
    }

    public async Task<ErrorOr<WorldBoardDto>> GetByIdAsync(Guid id)
    {
        var board = await wbRepository.GetByIdAsync(id);
        if (board == null)
            return Error.NotFound($"Board with id {id} not found.");

        return ToDto(board);
    }

    public async Task<ErrorOr<PagedResult<WorldBoardDto>>> GetArchivedPagedAsync(int page, int pageSize)
    {
        var result = await wbRepository
            .GetArchivedPagedAsync(WorldBoard.MonthStart(DateTime.UtcNow), page, pageSize);
        return new PagedResult<WorldBoardDto>()
        {
            Page = page,
            PageSize = pageSize,
            Data = result.Data.Select(ToDto).ToList(),
            Total = result.Total
        };
    }

    // get scene
    public async Task<ErrorOr<Stream>> GetSceneAsync(Guid boardId)
    {
        if (!await wbRepository.ExistsByIdAsync(boardId))
            return Error.NotFound($"Board with id {boardId} not found.");

        return await fileRepository.GetFileAsync(BoardFileKeys.Scene(boardId));
    }

    // save scene
    public async Task<ErrorOr<long?>> SaveSceneAsync(Guid userId, Guid boardId, long sceneHash, Stream stream)
    {
        var board =  await wbRepository.GetByIdAsync(boardId);
        if(board == null)
            return Error.NotFound($"Board with id {boardId} not found.");

        if (board.IsArchived(DateTime.UtcNow))
            return Error.Forbidden("WorldBoard.ReadOnly", "This world board is archived and read-only.");

        if(await permissionService.UserWorldBoardIsBannedAsync(userId))
            return Error.Forbidden("WorldBoard.Edit", "User is banned from WorldBoard");

        if (board.SceneHash == sceneHash)
            return (long?)null;

        board.SceneHash = sceneHash;
        await wbRepository.UpdateAsync(board);
        await fileRepository.UploadFileAsync(BoardFileKeys.Scene(boardId), stream);

        return board.SceneHash;
    }

    // get presigned links for files
    public async Task<ErrorOr<Dictionary<string, string>>> GetDownloadPresignedUrls(Guid boardId, List<string> sceneFileIds)
    {
        // Anonymous endpoint — without this check it would sign URLs for any user board's files.
        if (!await wbRepository.ExistsByIdAsync(boardId))
            return Error.NotFound($"Board with id {boardId} not found.");

        var result = await Task.WhenAll(sceneFileIds.Select(async fId => (
            FileId: fId,
            FileUrl: await fileRepository.GetDownloadUrlAsync(
                BoardFileKeys.File(boardId, fId), TimeSpan.FromMinutes(10)))
        ));

        return result.ToDictionary(k => k.FileId, v => v.FileUrl);
    }

    public async Task<ErrorOr<string>> GetUploadPresignedUrl(Guid userId, Guid boardId, string fileId)
    {
        var board = await wbRepository.GetByIdAsync(boardId);
        if (board == null)
            return Error.NotFound($"Board with id {boardId} not found.");

        if (board.IsArchived(DateTime.UtcNow))
            return Error.Forbidden("WorldBoard.ReadOnly", "This world board is archived and read-only.");

        if (await permissionService.UserWorldBoardIsBannedAsync(userId))
            return Error.Forbidden("WorldBoard.Edit", "User is banned from WorldBoard");

        var result = await fileRepository
            .GetUploadUrlAsync(BoardFileKeys.File(boardId, fileId), TimeSpan.FromMinutes(10));
        return result;
    }
}
