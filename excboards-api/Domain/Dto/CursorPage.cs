using System.Buffers.Text;
using System.Globalization;
using System.Text;

namespace Domain.Dto;

public class CursorPage<T>
{
    public List<T> Data { get; set; } = [];
    public string? NextCursor { get; set; }
    public int? Total { get; set; }
}

public readonly record struct PageCursor(string Key, Guid Id)
{
    public static PageCursor From(DateTime at, Guid id) =>
        new(at.ToUniversalTime().Ticks.ToString(CultureInfo.InvariantCulture), id);

    public bool TryGetTime(out DateTime at)
    {
        at = default;
        if (!long.TryParse(Key, NumberStyles.None, CultureInfo.InvariantCulture, out var ticks) ||
            ticks < DateTime.MinValue.Ticks || ticks > DateTime.MaxValue.Ticks)
            return false;
        at = new DateTime(ticks, DateTimeKind.Utc);
        return true;
    }

    public override string ToString() =>
        Base64Url.EncodeToString(Encoding.UTF8.GetBytes(Id.ToString("N") + Key));

    public static bool TryParse(string? value, out PageCursor? cursor)
    {
        cursor = null;
        if (string.IsNullOrEmpty(value)) return true;
        try
        {
            var raw = Encoding.UTF8.GetString(Base64Url.DecodeFromChars(value));
            if (raw.Length < 32 || !Guid.TryParseExact(raw[..32], "N", out var id)) return false;
            cursor = new PageCursor(raw[32..], id);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }
    
    public static bool TryParseTime(string? value, out TimeCursor? cursor)
    {
        cursor = null;
        if (!TryParse(value, out var parsed)) return false;
        if (parsed is not { } c) return true;
        if (!c.TryGetTime(out var at)) return false;
        cursor = new TimeCursor(at, c.Id);
        return true;
    }
}

public readonly record struct TimeCursor(DateTime At, Guid Id)
{
    public override string ToString() => PageCursor.From(At, Id).ToString();
}
