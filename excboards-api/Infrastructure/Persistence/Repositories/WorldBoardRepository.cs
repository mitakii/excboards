using Domain.Dto;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class WorldBoardRepository(AppDbContext context) : IWorldBoardRepository
{
    public Task<WorldBoard?> GetByIdAsync(Guid id)
    {
        return context.WorldBoards.FirstOrDefaultAsync(b => b.Id == id);
    }

    public Task<WorldBoard?> GetByDateAsync(DateOnly date)
    {
        return  context.WorldBoards.FirstOrDefaultAsync(b => b.CreatedAt == date);
    }

    public async Task<PagedResult<WorldBoard>> GetArchivedPagedAsync(DateOnly currentMonthStart, int page, int pageSize)
    {
        var archived = context.WorldBoards
            .Where(b => b.IsReadOnly || b.CreatedAt < currentMonthStart);

        var data = await archived
            .AsNoTracking()
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<WorldBoard>
        {
            Data = data,
            Total = await archived.CountAsync(),
            Page = page,
            PageSize = pageSize,
        };
    }

    public Task<WorldBoard?> GetLatestByDateAsync()
    {
        return context.WorldBoards.OrderByDescending(b => b.CreatedAt).FirstOrDefaultAsync();
    }

    public async Task AddAsync(WorldBoard worldBoard)
    {
        await context.AddAsync(worldBoard);
        await context.SaveChangesAsync();
    }

    public async Task<bool> TryAddAsync(WorldBoard worldBoard)
    {
        var entry = await context.AddAsync(worldBoard);
        try
        {
            await context.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException)
        {
            entry.State = EntityState.Detached;
            return false;
        }
    }

    public Task UpdateAsync(WorldBoard worldBoard)
    {
        context.WorldBoards.Update(worldBoard);
        return context.SaveChangesAsync();
    }

    public Task DeleteAsync(WorldBoard worldBoard)
    {
        context.WorldBoards.Remove(worldBoard);
        return context.SaveChangesAsync();
    }

    public Task<bool> ExistsByIdAsync(Guid id)
    {
        return context.WorldBoards.AnyAsync(b => b.Id == id);
    }
}