namespace Domain.Interfaces;

public interface ILikeRepository
{
    public Task<int> GetBoardLikesAsync(Guid boardId);
    public Task<bool> IsLikedAsync(Guid boardId, Guid userId);
    // false when the like already existed
    public Task<bool> LikeBoardAsync(Guid boardId, Guid userId);
    public Task UnlikeBoardAsync(Guid boardId, Guid userId);
}
