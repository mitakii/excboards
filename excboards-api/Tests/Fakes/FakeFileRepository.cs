using Application.Dto;
using Application.Interfaces;

namespace Tests.Fakes;

internal sealed class FakeFileRepository : IFileRepository
{
    public List<string> DeletedFileKeys { get; } = [];
    public List<IReadOnlyList<string>> DeletedFileBatches { get; } = [];
    public Dictionary<string, List<StorageObjectInfo>> ObjectsByPrefix { get; } = new();
    public Func<string, bool>? ThrowOnPrefix { get; set; }

    public Task UploadFileAsync(string key, Stream fileStream) => throw new NotImplementedException();
    public Task<Stream> GetFileAsync(string key) => throw new NotImplementedException();
    public Task<string> GetUploadUrlAsync(string key, TimeSpan expiry, string contentType, long contentLength) => throw new NotImplementedException();
    public Task<string> GetDownloadUrlAsync(string key, TimeSpan expiry) => throw new NotImplementedException();

    public Task<IReadOnlyList<StorageObjectInfo>> ListObjectsAsync(string prefix)
    {
        if (ThrowOnPrefix?.Invoke(prefix) == true)
            throw new InvalidOperationException($"Simulated failure listing objects under '{prefix}'");

        IReadOnlyList<StorageObjectInfo> result = ObjectsByPrefix.TryGetValue(prefix, out var list)
            ? list
            : [];
        return Task.FromResult(result);
    }

    public Task<bool> DeleteFileAsync(string key)
    {
        DeletedFileKeys.Add(key);
        return Task.FromResult(true);
    }

    public Task<bool> DeleteFilesAsync(IEnumerable<string> keys)
    {
        var list = keys.ToList();
        DeletedFileBatches.Add(list);
        DeletedFileKeys.AddRange(list);
        return Task.FromResult(true);
    }
}
