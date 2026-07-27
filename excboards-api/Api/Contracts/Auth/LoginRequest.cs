using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.Auth;

public sealed record LoginRequest(
    [Required] string Username,
    [Required] string Password);
