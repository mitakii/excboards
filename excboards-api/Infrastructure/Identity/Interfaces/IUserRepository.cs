namespace Infrastructure.Identity.Interfaces;

public interface IUserRepository
{
    public Task<List<User>> SearchUsersAsync(string query, int page, int pageSize);
}