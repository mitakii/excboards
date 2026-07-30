using Domain.Entities;
using Domain.Interfaces;

namespace Application.Tags;

public class TagService(ITagRepository tagRepository)
{
    public async Task<Tag> CreateAsync(string tagName)
    {
        var newTag = new Tag(tagName);
        await tagRepository.CreateTagAsync(newTag);
        return newTag;
    }
}