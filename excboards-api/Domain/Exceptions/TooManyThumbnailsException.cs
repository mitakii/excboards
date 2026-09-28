namespace Domain.Exceptions;

public class TooManyThumbnailsException(Guid boardId, int maxThumbnails)
    : Exception($"Board {boardId} already has the maximum of {maxThumbnails} thumbnails.")
{
    public Guid BoardId { get; } = boardId;
    public int MaxThumbnails { get; } = maxThumbnails;
}
