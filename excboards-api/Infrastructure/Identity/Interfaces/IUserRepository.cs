using Application.Dto;
using Domain.Dto;

namespace Infrastructure.Identity.Interfaces;

public interface IUserRepository
{
    public Task<CursorPage<UserDto>> SearchUsersAsync(string query, PageCursor? cursor, int pageSize);
}