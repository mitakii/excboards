using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
public class ErrorController : ControllerBase
{
    [Route("/error")]
    [HttpGet]
    public IActionResult Error()
    {
        return Problem(title: "Internal Server Error", statusCode: 500);
    }
}