namespace Application.Storage;

public class FileCleanupOptions
{
    public int IntervalHours { get; set; } = 24;
    public int MinFileAgeHours { get; set; } = 1;
}