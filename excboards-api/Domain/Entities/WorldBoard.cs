namespace Domain.Entities;

public class WorldBoard
{
    public Guid Id { get; set; }
    public DateOnly CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public long SceneHash { get; set; }
    public bool IsReadOnly { get; set; }

    public static DateOnly MonthStart(DateTime utcNow) => new(utcNow.Year, utcNow.Month, 1);
    public bool IsArchived(DateTime utcNow) => IsReadOnly || CreatedAt < MonthStart(utcNow);
}
