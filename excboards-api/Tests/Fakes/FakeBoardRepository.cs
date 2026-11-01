using Domain.Dto;
using Domain.Entities;
using Domain.Interfaces;

namespace Tests.Fakes;

internal sealed class FakeBoardRepository : IBoardRepository
{
    public List<UserBoard> DeletedBoards { get; } = [];

    public Task AddAsync(UserBoard board) => throw new NotImplementedException();
    public Task RemoveAsync(UserBoard board) => throw new NotImplementedException();

    public Task DeleteAsync(List<UserBoard> boards)
    {
        DeletedBoards.AddRange(boards);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(UserBoard board) => throw new NotImplementedException();
    public Task<UserBoard?> GetByIdAsync(Guid id) => throw new NotImplementedException();
    public Task<BoardSummaryDto?> GetSummaryByIdAsync(Guid id, Guid? viewerId) => throw new NotImplementedException();
    public Task<CursorPage<BoardSummaryDto>> GetLatestPagedAsync(Guid? userId, TimeCursor? cursor, int pageSize) =>
        throw new NotImplementedException();

    public Task<List<UserBoard>> GetAllByUserIdAsync(Guid userId) => throw new NotImplementedException();

    public Task<CursorPage<BoardSummaryDto>> GetAllByUserIdPagedAsync(Guid requestedUserId, Guid? currentUserId,
        TimeCursor? cursor, int pageSize) => throw new NotImplementedException();

    public Task<CursorPage<BoardSummaryDto>> SearchAsync(Guid? currentUserId, string query, TimeCursor? cursor, int pageSize) =>
        throw new NotImplementedException();

    public Task<CursorPage<BoardSummaryDto>> SearchByTagsAsync(Guid? currentUserId, List<Guid> tagIds, TimeCursor? cursor,
        int pageSize) => throw new NotImplementedException();

    public Task<CursorPage<BoardSummaryDto>> GetContributedPagedAsync(Guid userId, Guid? viewerId, TimeCursor? cursor,
        int pageSize) => throw new NotImplementedException();

    public Task<CursorPage<BoardSummaryDto>> GetLikedPagedAsync(Guid userId, Guid? viewerId, TimeCursor? cursor,
        int pageSize) => throw new NotImplementedException();

    public Task<UserBoardStatsDto?> GetUserBoardStatsAsync(Guid userId) => throw new NotImplementedException();

    public Task<List<UserBoard>> GetByTagsAsync(IEnumerable<Tag> tags) => throw new NotImplementedException();
    public Task<bool> ExistsByNameAsync(Guid userId, string name) => throw new NotImplementedException();
    public Task<bool> ExistsByIdAsync(Guid boardId) => throw new NotImplementedException();
}
