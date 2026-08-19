using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.User;

public sealed record ChangePfpRequest([Required] IFormFile Picture, [Required] string Password);