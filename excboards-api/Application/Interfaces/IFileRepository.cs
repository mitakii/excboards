namespace Application.Interfaces;

public interface IFileRepository
{
    Task UploadFileAsync(string key, Stream fileStream);
    Task<Stream> GetFileAsync(string key);
    Task<string> GetUploadUrlAsync(string key, TimeSpan expiry);
    Task<string> GetDownloadUrlAsync(string key, TimeSpan expiry);
}