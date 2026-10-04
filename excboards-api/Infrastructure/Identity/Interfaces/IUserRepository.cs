using Application.Dto;
using Domain.Dto;

namespace Infrastructure.Identity.Interfaces;

public interface IUserRepository
{
    public Task<PagedResult<UserDto>> SearchUsersAsync(string query, int page, int pageSize);
}