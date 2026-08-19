using Application.Dto;
using Infrastructure.Identity;

namespace Infrastructure.Mappers;

public static class UserMapper
{
    public static UserDto MapToDto(this User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.UserName,
            CreatedAtUtc = user.CreatedAtUtc,
            ProfilePictureUrl = user.ProfilePictureUrl
        };
    }
    
    public static List<UserDto> MapToDto(this List<User> user) => 
        user.Select(MapToDto).ToList();
}