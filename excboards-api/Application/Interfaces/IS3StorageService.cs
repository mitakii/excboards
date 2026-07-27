namespace Application.Interfaces;

public interface IS3StorageService
{
    Task<string?> GetSceneAsync(Guid roomId, CancellationToken cancellationToken = default);

    Task SaveSceneAsync(Guid roomId, string sceneJson, CancellationToken cancellationToken = default);

    Task<string> GeneratePresignedUploadUrlAsync(Guid roomId, string fileId, CancellationToken cancellationToken = default);
}
