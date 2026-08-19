using excboards_api.Contracts.Tag;

namespace excboards_api.Contracts.Boards;

public sealed record BoardResponse(
    Guid Id,
    string Name,
    string? Description,
    bool IsPublished,
    DateTime Created,
    DateTime Updated, 
    List<TagResponse> Tags);
