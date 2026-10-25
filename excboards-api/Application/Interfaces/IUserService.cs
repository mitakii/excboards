using Application.Dto;
using Domain.Dto;
using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Application.Interfaces;

public interface IUserService
{
    public Task<ErrorOr<UserDto>> GetUserByIdAsync(Guid userId);
    public Task<ErrorOr<UserDto>> GetUserByNameAsync(string username);
    public Task<ErrorOr<CursorPage<UserDto>>> SearchAsync(string query, PageCursor? cursor, int pageSize);
    
    public Task<ErrorOr<Updated>> UpdatePfpAsync(Guid userId, IFormFile picture);
    public Task<ErrorOr<Updated>> ChangeUsername(Guid userId, string newUsername);
    public Task<ErrorOr<bool>> HasPasswordAsync(Guid userId);
    public Task<ErrorOr<Updated>> ChangePassword(Guid userId, string oldPassword, string newPassword);
    public Task<ErrorOr<Updated>> SetPassword(Guid userId, string newPassword);
    public Task<ErrorOr<Updated>> ChangeEmail(Guid userId, string newEmail);
    
}