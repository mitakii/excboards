using System.Globalization;
using System.Text;
using System.Xml;
using Domain.Dto;
using Domain.Interfaces;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Options;

namespace Application.Sitemap;

public class SitemapService(ISitemapRepository repository, HybridCache cache, IOptions<SitemapOptions> options)
{
    public const int MaxUrls = 50_000;
    private const string CacheKey = "sitemap:xml";
    private const string Ns = "http://www.sitemaps.org/schemas/sitemap/0.9";

    private static readonly (string Path, string ChangeFreq, string Priority)[] StaticPages =
    [
        ("/", "daily", "1.0"),
        ("/world", "daily", "0.8"),
        ("/search", "weekly", "0.5"),
    ];

    public async Task<byte[]> GetXmlAsync()
    {
        var minutes = Math.Max(1, options.Value.CacheMinutes);
        return await cache.GetOrCreateAsync(
            CacheKey,
            async _ => await BuildAsync(),
            new HybridCacheEntryOptions
            {
                Expiration = TimeSpan.FromMinutes(minutes),
                LocalCacheExpiration = TimeSpan.FromMinutes(minutes),
            });
    }

    private async Task<byte[]> BuildAsync()
    {
        var siteUrl = options.Value.SiteUrl.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(siteUrl))
            throw new InvalidOperationException("Sitemap:SiteUrl is missing");

        var boardLimit = MaxUrls - StaticPages.Length;
        var boards = await repository.GetPublishedBoardsAsync(boardLimit);
        var users = await repository.GetUsersWithPublishedBoardsAsync(boardLimit - boards.Count);

        return Render(siteUrl, boards, users);
    }

    public static byte[] Render(string siteUrl, IEnumerable<SitemapBoardEntry> boards, IEnumerable<SitemapUserEntry> users)
    {
        using var stream = new MemoryStream();
        var settings = new XmlWriterSettings
        {
            Encoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false),
            Indent = true,
        };

        using (var xml = XmlWriter.Create(stream, settings))
        {
            xml.WriteStartDocument();
            xml.WriteStartElement("urlset", Ns);

            foreach (var page in StaticPages)
                WriteUrl(xml, siteUrl + page.Path, null, page.ChangeFreq, page.Priority);

            foreach (var board in boards)
                WriteUrl(xml, $"{siteUrl}/boards/{board.Id}", board.Updated, null, null);

            foreach (var user in users)
                WriteUrl(xml, $"{siteUrl}/u/{Uri.EscapeDataString(user.UserName)}", user.LastBoardUpdate, null, null);

            xml.WriteEndElement();
            xml.WriteEndDocument();
        }

        return stream.ToArray();
    }

    private static void WriteUrl(XmlWriter xml, string location, DateTime? lastMod, string? changeFreq, string? priority)
    {
        xml.WriteStartElement("url", Ns);
        
        xml.WriteElementString("loc", Ns, location);
        
        if (lastMod is { } lm)
            xml.WriteElementString("lastmod", Ns,
                DateTime.SpecifyKind(lm, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture));
        if (changeFreq is not null)
            xml.WriteElementString("changefreq", Ns, changeFreq);
        if (priority is not null)
            xml.WriteElementString("priority", Ns, priority);
        
        xml.WriteEndElement();
    }
}
