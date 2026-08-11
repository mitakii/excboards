using Infrastructure.Identity.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity.Repositories;

public class UserRepository(UserManager<User> userManager) : IUserRepository
{
    public Task<List<User>> SearchUsersAsync(string query, int page, int pageSize)
    {
        return userManager.Users
            .AsNoTracking()
            .Where(u => EF.Functions.ILike(u.UserName!, $"%{query}%"))
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }
}