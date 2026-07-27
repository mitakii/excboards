using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Identity;

public class User : IdentityUser<Guid>
{
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
