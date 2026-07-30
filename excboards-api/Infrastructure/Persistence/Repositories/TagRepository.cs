using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class TagRepository(AppDbContext context) : ITagRepository
{
    public Task CreateTagAsync(Tag tag)
    {
        context.Tags.Add(tag);
        return context.SaveChangesAsync();
    }

    public Task DeleteTagAsync(Tag tag)
    {
        context.Tags.Remove(tag);
        return context.SaveChangesAsync();
    }

    public Task<Tag?> GetTagAsync(Guid tagId)
    {
        return context.Tags.FirstOrDefaultAsync(t => t.Id == tagId);
    }

    public Task<List<Tag>> GetAllBoardTagsAsync(Guid boardId)
    {
        return context.UserBoards
            .AsNoTracking()
            .Where(b => b.UserId == boardId)
            .SelectMany(b => b.Tags)
            .ToListAsync();
    }

    public async Task<List<Tag>> CreateTagsAsync(List<string> tags)
    {
        if (tags.Count == 0)
            return null;
        
        tags = tags.Distinct().ToList();
        var result = await context.Tags.Where(t => tags.Contains(t.Name)).ToListAsync();
        
        var newTags = tags
            .Except(result
                .Select(t => t.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase))
            .Select(s => new Tag(s))
            .ToList();

        if (newTags.Count == 0) return result;
        
        await context.Tags.AddRangeAsync(newTags);
        await context.SaveChangesAsync();
        result = result.Concat(newTags).ToList();

        return result;
    }
}