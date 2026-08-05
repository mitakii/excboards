using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace excboards_api.Attributes;

public class ValidateImageAttribute : ActionFilterAttribute
{
    private readonly long _maxSize = 5 * 1024 * 1024;
    private readonly string[] _allowedContentTypes = { "image/jpeg", "image/png", "image/webp" };
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

    public bool Required { get; set; } = true;

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var files = context.HttpContext.Request.Form.Files;

        if (files.Count == 0)
        {
            if (Required)
                context.Result = new BadRequestObjectResult("No file selected");
            return;
        }

        foreach (var file in files)
        {
            if (file.Length == 0)
            {
                context.Result = new BadRequestObjectResult("No file uploaded");
                return;
            }

            if (file.Length > _maxSize)
            {
                context.Result = new BadRequestObjectResult("File size too large");
                return;
            }
            
            if (!_allowedContentTypes.Contains(file.ContentType))
            {
                context.Result = new BadRequestObjectResult("Invalid file format");
                return;
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(extension))
            {
                context.Result = new BadRequestObjectResult("Invalid file extension");
                return;
            }
        }
    }
}