using Application.Dto;
using Application.Interfaces;
using ErrorOr;
using Infrastructure.Identity.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity.Services;

public class UserService(IUserRepository userRepository, UserManager<User> userManager, ICloudinaryService cloudinaryService) : IUserService
{
    public async Task<ErrorOr<UserDto>> GetUserByIdAsync(Guid userId)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Error.NotFound("User.NotFound","User not found");

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.UserName,
            CreatedAtUtc = user.CreatedAtUtc,
            ProfilePictureUrl = user.ProfilePictureUrl,
        };
    }

    public async Task<ErrorOr<UserDto>> GetUserByNameAsync(string username)
    {
        var user = await userManager.FindByNameAsync(username);
        if (user is null)
            return Error.NotFound("User.NotFound", "User not found");
        
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.UserName,
            CreatedAtUtc = user.CreatedAtUtc,
            ProfilePictureUrl = user.ProfilePictureUrl,
        };
    }

    public async Task<ErrorOr<PagedResult<UserDto>>> SearchAsync(string query, int page, int pageSize)
    {
        var users = await userRepository.SearchUsersAsync(query, page, pageSize);

        return new PagedResult<UserDto>()
        {
            Total = users.Count,
            Page = page,
            PageSize = pageSize,
            Data = users.Select(user => new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.UserName,
                CreatedAtUtc = user.CreatedAtUtc,
                ProfilePictureUrl = user.ProfilePictureUrl,
            }).ToList()
        };
    }

    //settings
    public async Task<ErrorOr<Updated>> UpdatePfpAsync(Guid userId, IFormFile picture, string password)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Error.NotFound("User.NotFound","User not found");

        if(!await userManager.CheckPasswordAsync(user, password))
            return  Error.Unauthorized("User.ChangePfp", "Invalid password");

        var result = await cloudinaryService.AddPhotoAsync(picture);
        if (result.IsError)
            return result.Errors;

        user.ProfilePictureUrl = result.Value;
        var updateResult = await userManager.UpdateAsync(user);
        if(!updateResult.Succeeded)
            return Error.Validation("User.UpdatePfp", result.Errors.First().Description);
        
        return Result.Updated;
    }

    public async Task<ErrorOr<Updated>> ChangeUsername(Guid userId, string newUsername, string password)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Error.NotFound("User.NotFound", "User not found");
        
        if (!await userManager.CheckPasswordAsync(user, password))
            return Error.Unauthorized("User.ChangeUsername","Invalid password");
        
        user.UserName = newUsername;
        var result = await userManager.UpdateAsync(user);
        
        if(!result.Succeeded)
            return Error.Validation("User.ChangeUsername", result.Errors.First().Description);

        return Result.Updated;
    }

    public async Task<ErrorOr<Updated>> ChangePassword(Guid userId, string oldPassword, string newPassword)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Error.NotFound("User.NotFound", "User not found");
        
        var result = await userManager.ChangePasswordAsync(user, oldPassword, newPassword);
        if(!result.Succeeded)
            return Error.Unauthorized("User.ChangePassword", result.Errors.First().Description);
        
        return Result.Updated;
    }

    public async Task<ErrorOr<Updated>> ChangeEmail(Guid userId, string newEmail, string password)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Error.NotFound("User.NotFound", "User not found");
        
        if (!await userManager.CheckPasswordAsync(user, password))
            return Error.Unauthorized("User.ChangeUsername","Invalid password");
        
        user.Email = newEmail;
        var result = await userManager.UpdateAsync(user);
        
        if(!result.Succeeded)
            return Error.Validation("User.ChangeUsername", result.Errors.First().Description);

        return Result.Updated;
    }
    
}