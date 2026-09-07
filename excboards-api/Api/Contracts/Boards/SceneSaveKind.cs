namespace excboards_api.Contracts.Boards;

/// <summary>
/// How a scene save should be applied by other connected collaborators.
/// </summary>
public enum SceneSaveKind
{
    /// <summary>
    /// A normal debounced/partial persist. Peers merge the stored scene into
    /// their own via reconcile, keeping un-saved local edits.
    /// </summary>
    Incremental = 0,

    /// <summary>
    /// The whole scene was swapped out (e.g. a collaborator opened an
    /// .excalidraw file). Peers drop their current scene and take the stored
    /// one verbatim, including element removals.
    /// </summary>
    Replace = 1,
}
