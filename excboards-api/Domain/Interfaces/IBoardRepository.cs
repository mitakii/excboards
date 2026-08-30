using Domain.Entities;

namespace Domain.Interfaces;

public interface IBoardRepository
{
    Task AddAsync(UserBoard board);
    Task RemoveAsync(UserBoard board);
    Task DeleteAsync(List<UserBoard> boards);
    Task UpdateAsync(UserBoard board);
    
    Task<UserBoard?> GetByIdAsync(Guid id);
    Task<List<UserBoard>> GetAllByUserIdAsync(Guid userId);
    Task<List<UserBoard>> GetAllByUserIdPagedAsync(Guid requestedUserId,Guid currentUserId, int pageNumber, int pageSize);
    Task<List<UserBoard>> SearchAsync(Guid currentUserId, string query, int page = 1, int pageSize = 10);
    
    Task<List<UserBoard>> GetByTagsAsync(IEnumerable<Tag> tags);
    Task<bool> ExistsByNameAsync(Guid userId, string name);
}
