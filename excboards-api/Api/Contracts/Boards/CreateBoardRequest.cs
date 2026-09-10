using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Contracts.Boards;

public sealed record CreateBoardRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(1000)] string? Description, 
    List<string>? Tags,
    [Required] IFormFile Scene);
