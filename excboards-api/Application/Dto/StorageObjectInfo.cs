namespace Application.Dto;

public record StorageObjectInfo(string Key, DateTime LastModified, long Size = 0);
