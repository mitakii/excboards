using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.Boards;

public sealed record CreateBoardRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(1000)] string? Description);
