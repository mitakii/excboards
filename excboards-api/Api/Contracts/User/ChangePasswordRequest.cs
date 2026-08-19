using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.User;

public sealed record ChangePasswordRequest([Required] string OldPassword, [Required] string NewPassword);