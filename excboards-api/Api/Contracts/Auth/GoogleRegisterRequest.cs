using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.Auth;

public record GoogleRegisterRequest(
    [Required] string IdToken, 
    [Required, MinLength(3), MaxLength(32)] string Username);