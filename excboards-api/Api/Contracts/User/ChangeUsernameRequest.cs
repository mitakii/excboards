using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.User;

public sealed record ChangeUsernameRequest([Required, MinLength(3), MaxLength(32)] string NewUsername,[Required] string Password);