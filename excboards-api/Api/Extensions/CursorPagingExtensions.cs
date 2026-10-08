using Domain.Dto;
using excboards_api.Contracts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace excboards_api.Extensions;

public static class CursorPagingExtensions
{
    public static CursorResponse<T> ToResponse<T>(this CursorPage<T> page) =>
        new(page.Data, page.NextCursor, page.Total);

    public static IActionResult InvalidCursor(this ControllerBase controller)
    {
        var modelState = new ModelStateDictionary();
        modelState.AddModelError("cursor", "Invalid or expired cursor.");
        return controller.ValidationProblem(modelState);
    }
}
