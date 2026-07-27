using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.Auth;

public sealed record RegisterRequest(
    [Required, MinLength(3), MaxLength(32)] string Username,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);
