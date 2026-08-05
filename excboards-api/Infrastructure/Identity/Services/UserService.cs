using Application.Dto;
using Application.Interfaces;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Identity.Services;

public class UserService(UserManager<User> userManager, ICloudinaryService cloudinaryService) : IUserService
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
        };
    }

    //settings
    public async Task<ErrorOr<Updated>> UpdatePfpAsync(Guid userId, IFormFile picture, string password)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Error.NotFound("User.NotFound","User not found");

        if(!await userManager.CheckPasswordAsync(user, picture.FileName))
            return  Error.Unauthorized("User.ChangePfp", "Invalid password");
        
        var result = await cloudinaryService.AddPhotoAsync(picture);
        if (result.IsError)
            return result.Errors;
        
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