using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.User;

public sealed record ChangeUsernameRequest([Required] string NewUsername,[Required] string Password);