using Domain.Entities;

namespace Domain.Interfaces;

public interface ITagRepository
{
    public Task CreateTagAsync(Tag tag);
    public Task<List<Tag>> CreateTagsAsync(List<string> tags);
    public Task DeleteTagAsync(Tag tag);
    
    public Task<Tag?> GetTagAsync(Guid tagId);
    public Task<List<Tag>> GetAllBoardTagsAsync(Guid boardId);
}