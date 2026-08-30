using Application.Dto;

namespace Application.Interfaces;

public interface IFileRepository
{
    Task UploadFileAsync(string key, Stream fileStream);
    Task<Stream> GetFileAsync(string key);
    Task<string> GetUploadUrlAsync(string key, TimeSpan expiry);
    Task<string> GetDownloadUrlAsync(string key, TimeSpan expiry);
    Task<IReadOnlyList<StorageObjectInfo>> ListObjectsAsync(string prefix);
    Task<bool> DeleteFileAsync(string key);
    Task<bool> DeleteFilesAsync(IEnumerable<string> keys);
}