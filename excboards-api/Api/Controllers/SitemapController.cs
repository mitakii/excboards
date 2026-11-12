using Application.Sitemap;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
public class SitemapController(SitemapService sitemapService) : ControllerBase
{
    [HttpGet("/sitemap.xml")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> Get()
    {
        var xml = await sitemapService.GetXmlAsync();
        return File(xml, "application/xml; charset=utf-8");
    }
}
