using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class BoardRepository(AppDbContext context) : IBoardRepository
{
    public Task AddAsync(UserBoard board)
    {
        context.UserBoards.Add(board);
        return context.SaveChangesAsync();
    }

    public Task RemoveAsync(UserBoard board)
    {
        context.UserBoards.Remove(board);
        return context.SaveChangesAsync();
    }

    public Task UpdateAsync(UserBoard board)
    {
        context.UserBoards.Update(board);
        return context.SaveChangesAsync();
    }

    public Task<UserBoard?> GetByIdAsync(Guid id)
    {
        return context.UserBoards
            .AsNoTracking()
            .FirstOrDefaultAsync(ub => ub.Id == id);
    }

    public Task<List<UserBoard>> GetAllByUserIdAsync(Guid userId)
    {
        return context.UserBoards
            .AsNoTracking()
            .Where(ub => ub.UserId == userId)
            .ToListAsync();
    }

    public Task<List<UserBoard>> GetByTagsAsync(IEnumerable<Tag> tags)
    {
        var tagIds = tags.Select(t => t.Id).ToList();

        return context.UserBoards
            .Include(ub => ub.Tags)
            .AsNoTracking()
            .Where(ub => tagIds.All(id => ub.Tags.Select(t => t.Id).Contains(id)))
            .ToListAsync();
    }
}
