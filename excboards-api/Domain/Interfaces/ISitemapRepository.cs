using Domain.Dto;

namespace Domain.Interfaces;

public interface ISitemapRepository
{
    Task<List<SitemapBoardEntry>> GetPublishedBoardsAsync(int limit);
    Task<List<SitemapUserEntry>> GetUsersWithPublishedBoardsAsync(int limit);
}
