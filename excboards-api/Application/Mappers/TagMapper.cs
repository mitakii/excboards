using Application.Dto;
using Domain.Entities;

namespace Application.Mappers;

public static class TagMapper
{
    public static TagDto MapToDto(this Tag tag) =>
        new()
        {
            Id = tag.Id,
            Name = tag.Name,
        };
    
    public static List<TagDto> MapToDto(this ICollection<Tag> tags) =>
        tags.Select(MapToDto).ToList();
}