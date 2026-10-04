using Application.Dto;
using Domain.Dto;
using Infrastructure.Identity.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity.Repositories;

public class UserRepository(UserManager<User> userManager) : IUserRepository
{
    public async Task<PagedResult<UserDto>> SearchUsersAsync(string query, int page, int pageSize)
    {
        var q = userManager.Users
            .AsNoTracking()
            .Where(u => EF.Functions.ILike(u.UserName!, $"%{query}%"));

        var total = await q.CountAsync();

        var data = await q
            .OrderBy(u => u.UserName)
            .ThenBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto
            {
                UserId = u.Id,
                Username = u.UserName!,
                CreatedAtUtc = u.CreatedAtUtc,
                ProfilePictureUrl = u.ProfilePictureUrl
            })
            .ToListAsync();

        return new PagedResult<UserDto>()
        {
            Data = data,
            Page = page,
            PageSize = pageSize,
            Total = total,
        };
    }
}