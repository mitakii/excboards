using System.Collections.Immutable;
using Application.Mappers;
using Domain.Dto;
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
        try
        {
            context.UserBoards.Add(board);
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            context.Entry(board).State = EntityState.Detached;
            throw new DuplicateBoardNameException(board.UserId, board.Name);
        }
    }

    public Task RemoveAsync(UserBoard board)
    {
        board.DeletedAt = DateTime.UtcNow;
        return context.SaveChangesAsync();
    }

    public Task DeleteAsync(List<UserBoard> boards)
    {
        context.UserBoards.RemoveRange(boards);
        return context.SaveChangesAsync();
    }

    public async Task UpdateAsync(UserBoard board)
    {
        board.Updated = DateTime.UtcNow;
        context.UserBoards.Update(board);

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            throw new DuplicateBoardNameException(board.UserId, board.Name);
        }
    }

    public Task<UserBoard?> GetByIdAsync(Guid id)
    {
        return context.UserBoards
            .Include(ub => ub.Tags)
            .FirstOrDefaultAsync(ub => ub.Id == id);
    }

    public Task<List<UserBoard>> GetAllByUserIdAsync(Guid userId)
    {
        return context.UserBoards
            .AsNoTracking()
            .Where(ub => ub.UserId == userId)
            .ToListAsync();
    }

    public async Task<PagedResult<UserBoard>> GetAllByUserIdPagedAsync(Guid requestedUserId, Guid currentUserId, int pageNumber, int pageSize)
    {
        var q = context.UserBoards
            .AsNoTracking()
            .Include(ub => ub.Tags)
            .AsSplitQuery()
            .Where(ub => ub.UserId == requestedUserId &&
                         (ub.IsPublished ||
                          currentUserId == ub.UserId ||
                          ub.Collaborators.Any(c => c.UserId == currentUserId)))
            .OrderBy(ub => ub.Created)
            .ThenBy(ub => ub.Id);
        
        var count = await q.CountAsync();
            
        var data = await q
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<UserBoard>()
        {
            Data = data,
            Page = pageNumber,
            PageSize = data.Count,
            Total = count,
        };
    }

    public async Task<PagedResult<UserBoard>> SearchAsync(Guid currentUserId, string query, int page = 1, int pageSize = 10)
    {
        var q = context.UserBoards
            .AsNoTracking()
            .Include(ub => ub.Tags)
            .AsSplitQuery()
            .Where(ub => (
                EF.Functions.ILike(ub.Name, $"%{query}%") ||
                EF.Functions.ILike(ub.Description, $"%{query}%")) &&
                         (ub.IsPublished || 
                          currentUserId == ub.UserId || 
                          ub.Collaborators.Any(c => c.UserId == currentUserId)))
            .OrderBy(ub => ub.Created)
            .ThenBy(ub => ub.Id);
        
        var count = await q.CountAsync();
        
        var data = await q.Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<UserBoard>()
        {
            Data = data,
            Page = page,
            PageSize = data.Count,
            Total = count,
        };
    }

    public async Task<PagedResult<UserBoard>> SearchByTagsAsync(Guid currentUserId, List<Guid> tagIds, int page = 1, int pageSize = 10)
    {
        
        var q = context.UserBoards
            .AsNoTracking()
            .Include(ub => ub.Tags)
            .AsSplitQuery()
            .Where(ub => ub.Tags.Count(t => tagIds.Contains(t.Id)) == tagIds.Count &&
                         (ub.IsPublished || 
                          currentUserId == ub.UserId || 
                          ub.Collaborators.Any(c => c.UserId == currentUserId)))
            .OrderBy(ub => ub.Created)
            .ThenBy(ub => ub.Id);
        
        var count = await q.CountAsync();
        
        var data = await q.Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<UserBoard>()
        {
            Data = data,
            Page = page,
            PageSize = data.Count,
            Total = count,
        };
    }

    public Task<bool> ExistsByNameAsync(Guid userId, string name)
    {
        return context.UserBoards
            .AsNoTracking()
            .AnyAsync(ub => ub.UserId == userId && ub.NormalizedName == name.ToLower());
    }

    public Task<bool> ExistsByIdAsync(Guid boardId)
    {
        return context.UserBoards
            .AsNoTracking()
            .AnyAsync(ub => ub.Id == boardId);
    }

    public Task<List<UserBoard>> GetByTagsAsync(IEnumerable<Tag> tags)
    {
        var tagIds = tags.Select(t => t.Id).ToList();

        return context.UserBoards
            .AsNoTracking()
            .Include(ub => ub.Tags)
            .Where(ub => ub.Tags.Count(t => tagIds.Contains(t.Id)) == tagIds.Count)
            .ToListAsync();
    }
}
