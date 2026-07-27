namespace Infrastructure.Identity;

public class RefreshToken
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TokenHash { get; set; } = default!;
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public DateTime Expires { get; set; }
    public bool IsUsed { get; set; }
    public bool IsExpired => DateTime.UtcNow >= Expires;
}
