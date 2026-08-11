using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.Boards;

public record SearchRequest(
    [Required, MinLength(1)]string Query, 
    [Required] int Page = 1, 
    [Required] int PageSize = 10);