using Domain.Dto;
using Domain.Entities;

namespace Domain.Interfaces;

public interface IBoardRepository
{
    Task AddAsync(UserBoard board);
    Task RemoveAsync(UserBoard board);
    Task DeleteAsync(List<UserBoard> boards);
    Task UpdateAsync(UserBoard board);
    
    Task<UserBoard?> GetByIdAsync(Guid id);
    Task<BoardSummaryDto?> GetSummaryByIdAsync(Guid id, Guid? viewerId);
    Task<CursorPage<BoardSummaryDto>> GetLatestPagedAsync(Guid? userId, TimeCursor? cursor, int pageSize);
    Task<List<UserBoard>> GetAllByUserIdAsync(Guid userId);
    Task<CursorPage<BoardSummaryDto>> GetAllByUserIdPagedAsync(Guid requestedUserId, Guid? currentUserId, TimeCursor? cursor, int pageSize);
    Task<CursorPage<BoardSummaryDto>> SearchAsync(Guid? currentUserId, string query, TimeCursor? cursor, int pageSize);
    Task<CursorPage<BoardSummaryDto>> SearchByTagsAsync(Guid? currentUserId, List<Guid> tagIds, TimeCursor? cursor, int pageSize);
    Task<CursorPage<BoardSummaryDto>> GetContributedPagedAsync(Guid userId, Guid? viewerId, TimeCursor? cursor, int pageSize);
    Task<CursorPage<BoardSummaryDto>> GetLikedPagedAsync(Guid userId, Guid? viewerId, TimeCursor? cursor, int pageSize);
    Task<UserBoardStatsDto?> GetUserBoardStatsAsync(Guid userId);
    
    Task<List<UserBoard>> GetByTagsAsync(IEnumerable<Tag> tags);
    Task<bool> ExistsByNameAsync(Guid userId, string name);
    Task<bool> ExistsByIdAsync(Guid boardId);
}
