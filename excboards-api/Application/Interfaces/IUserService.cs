using Application.Dto;
using ErrorOr;

namespace Application.Interfaces;

public interface IUserService
{
    public Task<ErrorOr<UserDto>> GetUserByIdAsync(Guid userId);
    public Task<ErrorOr<UserDto>> GetUserByNameAsync(string username);
    
    public Task<ErrorOr<Updated>> ChangeUsername(Guid userId, string newUsername, string password);
    public Task<ErrorOr<Updated>> ChangePassword(Guid userId, string oldPassword, string newPassword);
    public Task<ErrorOr<Updated>> ChangeEmail(Guid userId, string newEmail,  string password);
    
}