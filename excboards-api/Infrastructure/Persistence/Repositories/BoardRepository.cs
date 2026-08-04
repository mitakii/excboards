using Domain.Entities;
using Domain.Exceptions;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Infrastructure.Persistence.Repositories;

public class BoardRepository(AppDbContext context) : IBoardRepository
{
    public async Task AddAsync(UserBoard board)
    {
        context.UserBoards.Add(board);
        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            throw new DuplicateBoardNameException(board.UserId, board.Name);
        }
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

    public Task<UserBoard?> GetByIdAsync(Guid userId, Guid id)
    {
        return context.UserBoards
            .Include(ub => ub.Tags)
            .FirstOrDefaultAsync(ub => ub.Id == id && ub.UserId == userId);
    }

    public Task<List<UserBoard>> GetAllByUserIdAsync(Guid userId)
    {
        return context.UserBoards
            .AsNoTracking()
            .Where(ub => ub.UserId == userId)
            .ToListAsync();
    }

    public Task<List<UserBoard>> GetAllByUserIdPagedAsync(Guid userId, int pageNumber, int pageSize)
    {
        return context.UserBoards
            .Where(ub => ub.UserId == userId)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public Task<bool> ExistsByNameAsync(Guid userId, string name)
    {
        return context.UserBoards
            .AsNoTracking()
            .AnyAsync(ub => ub.UserId == userId && ub.Name.ToLower() == name.ToLower());
    }

    public Task<List<UserBoard>> GetByTagsAsync(IEnumerable<Tag> tags)
    {
        var tagIds = tags.Select(t => t.Id).ToList();

        return context.UserBoards
            .AsNoTracking()
            .Include(ub => ub.Tags)
            .Where(ub => tagIds.All(id => ub.Tags.Select(t => t.Id).Contains(id)))
            .ToListAsync();
    }
}
