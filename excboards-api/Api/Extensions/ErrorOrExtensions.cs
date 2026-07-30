using ErrorOr;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace excboards_api.Extensions;

public static class ErrorOrExtensions
{
    public static IActionResult ToProblem<TValue>(this ErrorOr<TValue> result, ControllerBase controller)
    {
        if (!result.IsError)
            throw new InvalidOperationException("Cannot convert a successful ErrorOr result to a problem.");

        if (result.Errors.All(error => error.Type == ErrorType.Validation))
            return ValidationProblem(result.Errors, controller);

        return Problem(result.Errors, controller);
    }

    private static IActionResult Problem(List<Error> errors, ControllerBase controller)
    {
        var firstError = errors[0];
        var statusCode = firstError.Type switch
        {
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status500InternalServerError,
        };

        return controller.Problem(
            statusCode: statusCode,
            title: firstError.Description,
            extensions: new Dictionary<string, object?>
            {
                ["errors"] = errors.Select(error => new { error.Code, error.Description }),
            });
    }

    private static IActionResult ValidationProblem(List<Error> errors, ControllerBase controller)
    {
        var modelState = new ModelStateDictionary();
        foreach (var error in errors)
            modelState.AddModelError(error.Code, error.Description);

        return controller.ValidationProblem(modelState);
    }
}
