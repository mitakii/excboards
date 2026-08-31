namespace excboards_api.Contracts.Boards;

public sealed record BoardCollaboratorResponse(
    Guid BoardId,
    Guid UserId,
    string Username,
    string ProfilePictureUrl,
    DateTime Created,
    string Permission);