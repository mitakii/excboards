using Application.Dto;
using Domain.Enums;
using excboards_api.Contracts.Boards;

namespace excboards_api.Mappers;

public static class BoardCollaboratorResponseMapper
{
    public static BoardCollaboratorResponse MapToResponse(this BoardCollaboratorDto dto) =>
        new (
            dto.BoardId, 
            dto.UserId, 
            dto.CreatedAt, 
            Permission: dto.Permission.ToString());
    
    public static List<BoardCollaboratorResponse> MapToResponse(this List<BoardCollaboratorDto> dtos) => 
        dtos.Select(MapToResponse).ToList();
}