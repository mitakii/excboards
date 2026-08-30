namespace Application.Storage;

public class BoardDeletionOptions
{
    public int GracePeriodDays { get; set; } = 7;
    public int IntervalHours { get; set; } = 10;
}