using Application.Dto;
using excboards_api.Contracts.User;

namespace excboards_api.Mappers;

public static class UserResponseMapper
{
    public static UserResponse MapToResponse(this UserDto dto) =>
        new UserResponse(dto.Id, dto.Username, dto.Email, dto.CreatedAtUtc, dto.ProfilePictureUrl);
    
    public static List<UserResponse> MapToResponse(this List<UserDto> dtos) => 
        dtos.Select(MapToResponse).ToList();
    
    public static List<UserResponse> MapToResponse(this IReadOnlyList<UserDto> dtos) => 
        dtos.Select(MapToResponse).ToList();
}