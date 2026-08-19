using Application.Dto;
using Domain.Entities;

namespace Application.Mappers;

public static class BoardCollaboratorsMapper
{
    public static BoardCollaboratorDto MapToDto(this BoardCollaborator collaborator) =>
        new()
        {
            BoardId = collaborator.BoardId,
            CreatedAt = collaborator.CreatedAt,
            Permission = collaborator.Permission,
            UserId = collaborator.UserId,
        };
    
    public static List<BoardCollaboratorDto> MapToDto(this List<BoardCollaborator> collaborator) =>
        collaborator.Select(MapToDto).ToList();
}