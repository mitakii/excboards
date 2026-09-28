using Domain.Dto;
using Domain.Entities;

namespace Domain.Interfaces;

public interface IWorldBoardRepository
{
    public Task<WorldBoard?> GetByIdAsync(Guid id);
    public Task<WorldBoard?> GetByDateAsync(DateOnly date);
    public Task<PagedResult<WorldBoard>> GetArchivedPagedAsync(DateOnly currentMonthStart, int page, int pageSize);
    public Task<WorldBoard?> GetLatestByDateAsync();
    public Task AddAsync(WorldBoard worldBoard);
    // false when another board already claimed the same CreatedAt (unique index)
    public Task<bool> TryAddAsync(WorldBoard worldBoard);
    public Task UpdateAsync(WorldBoard worldBoard);
    public Task DeleteAsync(WorldBoard worldBoard);
    
    public Task<bool> ExistsByIdAsync(Guid id);
}