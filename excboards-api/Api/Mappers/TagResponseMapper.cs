using Application.Dto;
using excboards_api.Contracts.Tag;

namespace excboards_api.Mappers;

public static class TagResponseMapper
{
    public static TagResponse MapToResponse(this TagDto dto) => 
        new (dto.Id, dto.Name);
    
    public static List<TagResponse> MapToResponse(this List<TagDto> dtos) =>
        dtos.Select(MapToResponse).ToList();
}