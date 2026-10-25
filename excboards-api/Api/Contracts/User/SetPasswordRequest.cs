using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.User;

public sealed record SetPasswordRequest([Required] string NewPassword);