using System.Reflection;
using Application.Dto;
using Application.Mappers;
using Domain.Entities;
using Domain.Interfaces;
using ErrorOr;

namespace Application.Tags;

public class TagService(ITagRepository tagRepository)
{
    public async Task<ErrorOr<PagedResult<TagDto>>> Search(string query, int page, int pageSize)
    {
        var result = await tagRepository.SearchTags(query, page, pageSize);
        if(result.Count == 0)
            return Error.NotFound("Tags.Search", "No tags found");
        return new PagedResult<TagDto>()
        {
            Data = result.MapToDto(),
            Page = page,
            PageSize = pageSize,
            Total = result.Count
        };
    }
}