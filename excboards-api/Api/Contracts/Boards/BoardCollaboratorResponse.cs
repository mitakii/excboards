namespace excboards_api.Contracts.Boards;

public sealed record BoardCollaboratorResponse(Guid BoardId, Guid UserId, DateTime Created, string Permission);