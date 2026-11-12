namespace Domain.Dto;

public record SitemapBoardEntry(Guid Id, DateTime Updated);

public record SitemapUserEntry(string UserName, DateTime LastBoardUpdate);
