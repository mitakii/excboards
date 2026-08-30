using Application.Dto;
using Application.Interfaces;

namespace Infrastructure.Storage.Repositories;

public class MinioFileRepository(MinioStorage storage) : IFileRepository
{
    public async Task UploadFileAsync(string key, Stream fileStream)
    {
        await storage.UploadFileAsync(key, fileStream);
    }

    public async Task<Stream> GetFileAsync(string key)
    {
        return await storage.GetFileAsync(key);
    }

    public async Task<string> GetUploadUrlAsync(string key, TimeSpan expiry)
    {
        return await storage.GetPresignedUploadUrlAsync(key, expiry);
    }

    public async Task<string> GetDownloadUrlAsync(string key, TimeSpan expiry)
    {
        return await storage.GetPresignedDownloadUrlAsync(key, expiry);
    }

    public async Task<IReadOnlyList<StorageObjectInfo>> ListObjectsAsync(string prefix)
    {
        return await storage.ListObjectsAsync(prefix);
    }

    public async Task<bool> DeleteFileAsync(string key)
    {
        return await storage.DeleteFileAsync(key);
    }

    public async Task<bool> DeleteFilesAsync(IEnumerable<string> keys)
    {
        return await storage.DeleteFilesAsync(keys);
    }
}