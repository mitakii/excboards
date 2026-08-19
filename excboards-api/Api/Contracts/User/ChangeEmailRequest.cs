using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.User;

public sealed record ChangeEmailRequest([EmailAddress][Required] string NewEmail,[Required] string Password);