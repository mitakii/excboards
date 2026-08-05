using Application.Interfaces;
using BusinessLayer.DTO;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Error = ErrorOr.Error;

namespace Infrastructure.Storage;

public class CloudinaryService : ICloudinaryService
{
    
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IOptions<CloudinarySettings> config)
    {
        var account = new Account(config.Value.CloudName, config.Value.ApiKey, config.Value.ApiSecret);
        _cloudinary = new Cloudinary(account);
    }

    public async Task<ErrorOr<string>> AddPhotoAsync(IFormFile photo)
    {
        var uploadResult = new ImageUploadResult();

        if (photo.Length > 0)
        {
            await using var stream = photo.OpenReadStream();

            var uploadParams = new ImageUploadParams()
            {
                File = new FileDescription(photo.FileName, stream),
                Transformation = new Transformation().Height(500).Width(500).Crop("fill").Gravity("face"),
                Folder = "profile-pictures",
            };
            
            uploadResult = await _cloudinary.UploadAsync(uploadParams);
        }
        else 
            return Error.Validation("Pfp.AddImage", "Image is empty");

        return uploadResult.Error != null ? 
            Error.Unexpected("Cloudinary.Error", uploadResult.Error.Message) : 
            uploadResult.Url.AbsoluteUri;
    }

    public async Task<ErrorOr<Deleted>> DeletePhotoAsync(string photoId)
    {
        var deleteParams = new DeletionParams(photoId);
        var result =  await _cloudinary.DestroyAsync(deleteParams);
        
        if(result.Error != null)
            return Error.Unexpected("Cloudinary.Error", result.Error.Message);
        
        return Result.Deleted;
    }
}