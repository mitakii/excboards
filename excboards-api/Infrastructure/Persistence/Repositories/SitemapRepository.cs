using Domain.Dto;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class SitemapRepository(AppDbContext context) : ISitemapRepository
{
    public Task<List<SitemapBoardEntry>> GetPublishedBoardsAsync(int limit)
    {
        return context.UserBoards
            .AsNoTracking()
            .Where(b => b.IsPublished)
            .Where(b => context.Users.Any(u => u.Id == b.UserId && !u.IsBanned))
            .OrderByDescending(b => b.Updated)
            .Take(limit)
            .Select(b => new SitemapBoardEntry(b.Id, b.Updated))
            .ToListAsync();
    }

    public Task<List<SitemapUserEntry>> GetUsersWithPublishedBoardsAsync(int limit)
    {
        return context.UserBoards
            .AsNoTracking()
            .Where(b => b.IsPublished)
            .Join(context.Users.Where(u => !u.IsBanned && u.UserName != null),
                b => b.UserId, u => u.Id,
                (b, u) => new { u.UserName, b.Updated })
            .GroupBy(x => x.UserName!)
            .Select(g => new { UserName = g.Key, LastBoardUpdate = g.Max(x => x.Updated) })
            .OrderByDescending(x => x.LastBoardUpdate)
            .Take(limit)
            .Select(x => new SitemapUserEntry(x.UserName, x.LastBoardUpdate))
            .ToListAsync();
    }
}
