namespace Application.Storage;

public class UploadLimitsOptions
{
    public long MaxSceneBytes { get; set; } = 5 * 1024 * 1024;
    public long MaxFileBytes { get; set; } = 4 * 1024 * 1024;
    public long MaxThumbnailBytes { get; set; } = 1 * 1024 * 1024;
    public int MaxFilesPerBoard { get; set; } = 100;
    public long MaxBoardFileBytes { get; set; } = 50 * 1024 * 1024;
}
