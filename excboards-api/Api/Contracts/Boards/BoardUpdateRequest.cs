namespace excboards_api.Contracts.Boards;

public record BoardUpdateRequest(string Name, string Description, List<string> Tags);