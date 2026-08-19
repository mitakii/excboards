using Application.Dto;
using excboards_api.Contracts.Boards;

namespace excboards_api.Mappers;

public static class UserBoardResponseMapper
{
    public static BoardResponse MapToResponse(this UserBoardDto dto) =>
        new BoardResponse(
            dto.Id,
            dto.Name,
            dto.Description,
            dto.IsPublished,
            dto.Created,
            dto.Updated,
            dto.Tags.MapToResponse());
    
    public static List<BoardResponse> MapToResponse(this List<UserBoardDto> dtos) =>
        dtos.Select(MapToResponse).ToList();
    
    public static List<BoardResponse> MapToResponse(this IReadOnlyList<UserBoardDto> dtos) =>
        dtos.Select(MapToResponse).ToList();
}