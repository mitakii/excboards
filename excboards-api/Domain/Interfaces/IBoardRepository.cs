using Domain.Entities;

namespace Domain.Interfaces;

public interface IBoardRepository
{
    Task AddAsync(UserBoard board);
    Task RemoveAsync(UserBoard board);
    Task UpdateAsync(UserBoard board);
    
    Task<UserBoard?> GetByIdAsync(Guid id);
    Task<List<UserBoard>> GetAllByUserIdAsync(Guid userId);
    Task<List<UserBoard>> GetByTagsAsync(IEnumerable<Tag> tags);
}
