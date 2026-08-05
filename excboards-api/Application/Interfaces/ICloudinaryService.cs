using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Application.Interfaces;

public interface ICloudinaryService
{
    public Task<ErrorOr<string>> AddPhotoAsync(IFormFile photo);
    public Task<ErrorOr<Deleted>> DeletePhotoAsync(string photoId);
}