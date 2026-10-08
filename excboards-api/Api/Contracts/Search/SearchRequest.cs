using System.ComponentModel.DataAnnotations;

namespace excboards_api.Contracts.Search;

public record SearchRequest(
    [Required, MinLength(1)]string Query, 
    string? Cursor = null,
    [Required] int PageSize = 10);