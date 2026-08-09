using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.Boards;

public sealed record SaveSceneRequest([Required] IFormFile Scene);
