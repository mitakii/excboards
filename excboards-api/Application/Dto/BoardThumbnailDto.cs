namespace Application.Dto;

public class BoardThumbnailDto
{
    public Guid BoardId { get; set; }
    public int Position { get; set; }
    public string? UploadUrl { get; set; }
    public string? DownloadUrl { get; set; }
}