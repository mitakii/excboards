namespace Application.Storage;

public static class BoardFileKeys
{
    public static string Scene(Guid boardId) => $"boards/{boardId}/scene.json";
    public static string File(Guid boardId, string fileId) => $"boards/{boardId}/files/{fileId}";
    public static string FilesPrefix(Guid boardId) => $"boards/{boardId}/files/";
    public static string BoardPrefix(Guid boardId) => $"boards/{boardId}/";
    public static string ThumbnailsPrefix(Guid boardId) => $"boards/{boardId}/thumbnails/";
    public static string Thumbnail(Guid boardId, Guid thumbnailId) => $"boards/{boardId}/thumbnails/{thumbnailId}";
}
