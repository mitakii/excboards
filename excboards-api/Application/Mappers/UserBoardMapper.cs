using Application.Dto;
using Domain.Entities;

namespace Application.Mappers;

public static class UserBoardMapper
{
    public static UserBoardDto MapToDto(this UserBoard userBoard)=>
        new()
        {
            Id = userBoard.Id,
            UserId = userBoard.UserId,
            Name = userBoard.Name,
            IsPublished = userBoard.IsPublished,
            Created = userBoard.Created,
            Updated = userBoard.Updated,
            Description = userBoard.Description,
            Tags = userBoard.Tags.MapToDto()
        };
    
    public static List<UserBoardDto> MapToDto(this ICollection<UserBoard> userBoards) =>
        userBoards.Select(MapToDto).ToList();
}