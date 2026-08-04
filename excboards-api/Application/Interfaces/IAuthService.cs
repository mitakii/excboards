using Application.Auth;
using ErrorOr;

namespace Application.Interfaces;

public interface IAuthService
{
    Task<ErrorOr<LoginResult>> LoginAsync(string username, string password);
}
