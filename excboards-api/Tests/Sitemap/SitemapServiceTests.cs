using System.Text;
using System.Xml.Linq;
using Application.Sitemap;
using Domain.Dto;
using Xunit;

namespace Tests.Sitemap;

public class SitemapServiceTests
{
    private static readonly XNamespace Ns = "http://www.sitemaps.org/schemas/sitemap/0.9";

    [Fact]
    public void Render_ListsStaticPagesBoardsAndUsers()
    {
        var boardId = Guid.NewGuid();
        var updated = new DateTime(2026, 11, 1, 8, 30, 0, DateTimeKind.Unspecified); // Npgsql may return Unspecified

        var bytes = SitemapService.Render(
            "https://excb.example.com",
            [new SitemapBoardEntry(boardId, updated)],
            [new SitemapUserEntry("a b&c", updated)]);

        var text = Encoding.UTF8.GetString(bytes);
        Assert.StartsWith("<?xml version=\"1.0\" encoding=\"utf-8\"?>", text); // no BOM, utf-8 declared

        var urls = XDocument.Parse(text).Root!.Elements(Ns + "url").ToList();
        var locs = urls.Select(u => u.Element(Ns + "loc")!.Value).ToList();

        Assert.Equal(
            [
                "https://excb.example.com/",
                "https://excb.example.com/world",
                "https://excb.example.com/search",
                $"https://excb.example.com/boards/{boardId}",
                "https://excb.example.com/u/a%20b%26c",
            ],
            locs);
        Assert.Equal("2026-11-01T08:30:00Z", urls[3].Element(Ns + "lastmod")!.Value);
    }
}
