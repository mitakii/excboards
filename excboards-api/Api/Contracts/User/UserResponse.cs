using Domain.Enums;

namespace excboards_api.Contracts.User;

public sealed record UserResponse(Guid UserId, string Username, string Email, DateTime CreatedAtUtc, string ProfilePictureUrl);