using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.Auth;

public record GoogleLoginRequest([Required] string IdToken);