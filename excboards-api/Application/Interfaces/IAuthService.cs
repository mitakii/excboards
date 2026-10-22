using Application.Auth;
using Application.Dto;
using ErrorOr;

namespace Application.Interfaces;

public interface IAuthService
{
    Task<ErrorOr<LoginResult>> LoginAsync(string username, string password);
    Task<ErrorOr<LoginResult>> RegisterWithGoogleAsync(string idToken, string username);
    Task<ErrorOr<GoogleLoginResult>> LoginWithGoogleAsync(string idToken);
}
