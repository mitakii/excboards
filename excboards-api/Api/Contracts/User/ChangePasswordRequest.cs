namespace excboards_api.Contracts.User;

public record ChangePasswordRequest(string OldPassword, string NewPassword);