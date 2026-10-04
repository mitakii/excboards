using Domain.Dto;
using Domain.Interfaces;
using ErrorOr;

namespace Application.Tags;

public class TagService(ITagRepository tagRepository)
{
    public async Task<ErrorOr<PagedResult<TagDto>>> SearchAsync(string query, int page, int pageSize)
    {
        return await tagRepository.SearchTags(query, page, pageSize);
    }
}