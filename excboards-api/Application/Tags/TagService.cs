using Domain.Entities;
using Domain.Interfaces;
using ErrorOr;

namespace Application.Tags;

public class TagService(ITagRepository tagRepository)
{
    public async Task<ErrorOr<List<Tag>>> Search(string query, int page, int pageSize)
    {
        var result = await tagRepository.SearchTags(query, page, pageSize);
        if(result.Count == 0)
            return Error.NotFound("Tags.Search", "No tags found");
        return result;
    }
}