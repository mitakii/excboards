using Domain.Entities;

namespace Domain.Interfaces;

public interface IThumbnailRepository
{
    public Task<BoardThumbnail?> GetBoardThumbnailAsync(Guid boardId, int position);
    public Task<List<BoardThumbnail>> GetBoardThumbnailsAsync(Guid boardId);
    public Task<BoardThumbnail> AddNextBoardThumbnailAsync(Guid boardId, int maxThumbnails);
    public Task DeleteBoardThumbnailAsync(BoardThumbnail thumbnail);
    
    public Task<int> GetThumbnailsCount(Guid boardId);
}