using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.Boards;

public sealed record SaveSceneRequest(
    [Required] IFormFile Scene,
    [Required] long SceneHash,
    SceneSaveKind Kind = SceneSaveKind.Incremental);

public static class SceneRequestLimits
{
    public const long MaxRequestBytes = 6 * 1024 * 1024;
}
