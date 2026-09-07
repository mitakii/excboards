namespace excboards_api.Contracts.Boards;

/// <summary>
/// How a scene save should be applied by other connected collaborators.
/// </summary>
public enum SceneSaveKind
{
    Incremental = 0,
    Replace = 1,
}
