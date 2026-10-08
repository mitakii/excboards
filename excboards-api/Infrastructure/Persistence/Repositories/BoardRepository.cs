using System.Collections.Immutable;
using Domain.Dto;
using Domain.Entities;
using Domain.Enums;
using Domain.Exceptions;
using Domain.Interfaces;
using Infrastructure.Persistence.Projections;
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

    public Task<BoardSummaryDto?> GetSummaryByIdAsync(Guid id, Guid? viewerId)
    {
        return context.UserBoards
            .AsNoTracking()
            .Where(ub => ub.Id == id)
            .Select(BoardProjections.Summary(viewerId))
            .FirstOrDefaultAsync();
    }

    public Task<CursorPage<BoardSummaryDto>> GetLatestPagedAsync(Guid? userId, TimeCursor? cursor, int pageSize)
    {
        var q = context.UserBoards
            .AsNoTracking()
            .Where(ub => ub.IsPublished ||
                         userId == ub.UserId ||
                         ub.Collaborators.Any(c => c.UserId == userId));

        return NewestCreatedFirstAsync(q, userId, cursor, pageSize);
    }

    public Task<List<UserBoard>> GetAllByUserIdAsync(Guid userId)
    {
        return context.UserBoards
            .AsNoTracking()
            .Where(ub => ub.UserId == userId)
            .ToListAsync();
    }

    public Task<CursorPage<BoardSummaryDto>> GetAllByUserIdPagedAsync(Guid requestedUserId, Guid? currentUserId, TimeCursor? cursor, int pageSize)
    {
        var q = context.UserBoards
            .AsNoTracking()
            .Where(ub => ub.UserId == requestedUserId &&
                         (ub.IsPublished ||
                          currentUserId == ub.UserId ||
                          ub.Collaborators.Any(c => c.UserId == currentUserId)));

        return NewestCreatedFirstAsync(q, currentUserId, cursor, pageSize);
    }

    public Task<CursorPage<BoardSummaryDto>> SearchAsync(Guid? currentUserId, string query, TimeCursor? cursor, int pageSize)
    {
        var q = context.UserBoards
            .AsNoTracking()
            .Where(ub => (
                EF.Functions.ILike(ub.Name, $"%{query}%") ||
                EF.Functions.ILike(ub.Description, $"%{query}%")) &&
                         (ub.IsPublished || 
                          currentUserId == ub.UserId || 
                          ub.Collaborators.Any(c => c.UserId == currentUserId)));

        return OldestCreatedFirstAsync(q, currentUserId, cursor, pageSize);
    }

    public Task<CursorPage<BoardSummaryDto>> SearchByTagsAsync(Guid? currentUserId, List<Guid> tagIds, TimeCursor? cursor, int pageSize)
    {
        var q = context.UserBoards
            .AsNoTracking()
            .Where(ub => ub.Tags.Count(t => tagIds.Contains(t.Id)) == tagIds.Count &&
                         (ub.IsPublished || 
                          currentUserId == ub.UserId || 
                          ub.Collaborators.Any(c => c.UserId == currentUserId)));

        return OldestCreatedFirstAsync(q, currentUserId, cursor, pageSize);
    }

    public async Task<CursorPage<BoardSummaryDto>> GetContributedPagedAsync(Guid userId, Guid? viewerId, TimeCursor? cursor, int pageSize)
    {
        var q = context.UserBoards
            .AsNoTracking()
            .Where(ub => ub.UserId != userId &&
                         ub.Collaborators.Any(c => c.UserId == userId && c.Permission != PermissionLevel.Viewer) &&
                         (ub.IsPublished ||
                          viewerId == ub.UserId ||
                          ub.Collaborators.Any(c => c.UserId == viewerId)));

        int? total = cursor is null ? await q.CountAsync() : null;
        
        if (cursor is { } c)
            q = q.Where(ub => EF.Functions.LessThan(
                ValueTuple.Create(ub.Updated, ub.Id), ValueTuple.Create(c.At, c.Id)));

        var rows = await q
            .OrderByDescending(ub => ub.Updated)
            .ThenByDescending(ub => ub.Id)
            .Take(pageSize + 1)
            .Select(BoardProjections.Summary(viewerId))
            .ToListAsync();

        return CursorPaging.Build(rows, pageSize, total, b => new TimeCursor(b.Updated, b.Id).ToString());
    }

    public async Task<CursorPage<BoardSummaryDto>> GetLikedPagedAsync(Guid userId, Guid? viewerId, TimeCursor? cursor, int pageSize)
    {
        var q = context.BoardLikes
            .AsNoTracking()
            .Where(l => l.UserId == userId &&
                        (l.Board.IsPublished ||
                         viewerId == l.Board.UserId ||
                         l.Board.Collaborators.Any(c => c.UserId == viewerId)));

        int? total = cursor is null ? await q.CountAsync() : null;

        if (cursor is { } c)
            q = q.Where(l => EF.Functions.LessThan(
                ValueTuple.Create(l.CreatedAt, l.Id), ValueTuple.Create(c.At, c.Id)));
        
        var likes = await q
            .OrderByDescending(l => l.CreatedAt)
            .ThenByDescending(l => l.Id)
            .Take(pageSize + 1)
            .Select(l => new { l.Id, l.CreatedAt, l.BoardId })
            .ToListAsync();

        var boardIds = likes.Select(l => l.BoardId).ToList();
        var summaries = await context.UserBoards
            .AsNoTracking()
            .Where(ub => boardIds.Contains(ub.Id))
            .Select(BoardProjections.Summary(viewerId))
            .ToDictionaryAsync(b => b.Id);

        var page = CursorPaging.Build(likes, pageSize, total, l => new TimeCursor(l.CreatedAt, l.Id).ToString());
        return new CursorPage<BoardSummaryDto>
        {
            Data = page.Data.Where(l => summaries.ContainsKey(l.BoardId)).Select(l => summaries[l.BoardId]).ToList(),
            NextCursor = page.NextCursor,
            Total = page.Total,
        };
    }

    private async Task<CursorPage<BoardSummaryDto>> NewestCreatedFirstAsync(
        IQueryable<UserBoard> q, Guid? viewerId, TimeCursor? cursor, int pageSize)
    {
        int? total = cursor is null ? await q.CountAsync() : null;

        if (cursor is { } c)
            q = q.Where(ub => EF.Functions.LessThan(
                ValueTuple.Create(ub.Created, ub.Id), ValueTuple.Create(c.At, c.Id)));

        var rows = await q
            .OrderByDescending(ub => ub.Created)
            .ThenByDescending(ub => ub.Id)
            .Take(pageSize + 1) // for later check if there is more items to load
            .Select(BoardProjections.Summary(viewerId))
            .ToListAsync();

        return CursorPaging.Build(
            rows, 
            pageSize, 
            total, 
            b => new TimeCursor(b.Created, b.Id).ToString());
    }

    private async Task<CursorPage<BoardSummaryDto>> OldestCreatedFirstAsync(
        IQueryable<UserBoard> q, Guid? viewerId, TimeCursor? cursor, int pageSize)
    {
        int? total = cursor is null ? await q.CountAsync() : null;

        if (cursor is { } c)
            q = q.Where(ub => EF.Functions.GreaterThan(
                ValueTuple.Create(ub.Created, ub.Id), ValueTuple.Create(c.At, c.Id)));

        var rows = await q
            .OrderBy(ub => ub.Created)
            .ThenBy(ub => ub.Id)
            .Take(pageSize + 1) // for later check if there is more items to load
            .Select(BoardProjections.Summary(viewerId))
            .ToListAsync();

        return CursorPaging.Build(rows, pageSize, total, b => new TimeCursor(b.Created, b.Id).ToString());
    }

    public Task<UserBoardStatsDto?> GetUserBoardStatsAsync(Guid userId)
    {
        return context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new UserBoardStatsDto
            {
                PublicBoards = context.UserBoards.Count(b => b.UserId == userId && b.IsPublished),
                LikesReceived = context.BoardLikes.Count(l => l.Board.UserId == userId && l.Board.IsPublished),
                ContributedBoards = context.UserBoards.Count(b =>
                    b.UserId != userId &&
                    b.IsPublished &&
                    b.Collaborators.Any(c => c.UserId == userId && c.Permission != PermissionLevel.Viewer)),
            })
            .FirstOrDefaultAsync();
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
