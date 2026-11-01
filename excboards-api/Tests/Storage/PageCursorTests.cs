using Domain.Dto;
using Xunit;

namespace Tests.Storage;

public class PageCursorTests
{
    [Fact]
    public void TimeCursor_RoundTrips_ExactTicksAsUtc()
    {
        var at = new DateTime(2026, 10, 8, 12, 34, 56, DateTimeKind.Utc).AddTicks(1234560); // microsecond precision, like Postgres
        var id = Guid.NewGuid();

        var encoded = new TimeCursor(at, id).ToString();

        Assert.True(PageCursor.TryParseTime(encoded, out var parsed));
        Assert.Equal(at, parsed!.Value.At);
        Assert.Equal(DateTimeKind.Utc, parsed.Value.At.Kind);
        Assert.Equal(id, parsed.Value.Id);
    }

    [Fact]
    public void StringKeyCursor_RoundTrips_IncludingUnicode()
    {
        var id = Guid.NewGuid();
        var encoded = new PageCursor("žluťoučký_kůň", id).ToString();

        Assert.True(PageCursor.TryParse(encoded, out var parsed));
        Assert.Equal(new PageCursor("žluťoučký_kůň", id), parsed);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void MissingCursor_MeansFirstPage(string? value)
    {
        Assert.True(PageCursor.TryParseTime(value, out var parsed));
        Assert.Null(parsed);
    }

    [Theory]
    [InlineData("not base64 !!")]
    [InlineData("AAAA")] // decodes, but too short to hold an id
    public void Garbage_IsRejected(string value)
    {
        Assert.False(PageCursor.TryParse(value, out _));
        Assert.False(PageCursor.TryParseTime(value, out _));
    }

    [Fact]
    public void NameCursor_IsNotAcceptedAsTimeCursor()
    {
        var encoded = new PageCursor("alice", Guid.NewGuid()).ToString();
        Assert.False(PageCursor.TryParseTime(encoded, out _));
    }
}
