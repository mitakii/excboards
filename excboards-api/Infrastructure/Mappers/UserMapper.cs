using Application.Dto;
using Infrastructure.Identity;

namespace Infrastructure.Mappers;

public static class UserMapper
{
    public static UserDto MapToDto(this User user)
    {
        return new UserDto
        {
            UserId = user.Id,
            Username = user.UserName,
            CreatedAtUtc = user.CreatedAtUtc,
            ProfilePictureUrl = user.ProfilePictureUrl
        };
    }
}