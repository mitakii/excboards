using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.User;

public record ChangePfpRequest(IFormFile Picture, [Required] string Password);