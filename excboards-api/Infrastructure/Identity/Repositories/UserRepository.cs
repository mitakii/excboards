using Application.Dto;
using Domain.Dto;
using Infrastructure.Identity.Interfaces;
using Microsoft.AspNetCore.Identity;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity.Repositories;

public class UserRepository(UserManager<User> userManager) : IUserRepository
{
    public async Task<CursorPage<UserDto>> SearchUsersAsync(string query, PageCursor? cursor, int pageSize)
    {
        var q = userManager.Users
            .AsNoTracking()
            .Where(u => EF.Functions.ILike(u.UserName!, $"%{query}%"));

        int? total = cursor is null ? await q.CountAsync() : null;
        
        if (cursor is { } c)
            q = q.Where(u => EF.Functions.GreaterThan(
                ValueTuple.Create(u.UserName, u.Id), ValueTuple.Create(c.Key, c.Id)));

        var data = await q
            .OrderBy(u => u.UserName)
            .ThenBy(u => u.Id)
            .Take(pageSize + 1)
            .Select(u => new UserDto
            {
                UserId = u.Id,
                Username = u.UserName!,
                CreatedAtUtc = u.CreatedAtUtc,
                ProfilePictureUrl = u.ProfilePictureUrl
            })
            .ToListAsync();

        return CursorPaging.Build(data, pageSize, total, u => new PageCursor(u.Username, u.UserId).ToString());
    }
}