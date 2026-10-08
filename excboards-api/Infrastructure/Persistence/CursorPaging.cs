using Domain.Dto;

namespace Infrastructure.Persistence;

internal static class CursorPaging
{
    public static CursorPage<T> Build<T>(List<T> rows, int pageSize, int? total, Func<T, string> cursorOf)
    {
        var hasMore = rows.Count > pageSize;
        if (hasMore) 
            rows.RemoveAt(rows.Count - 1);

        return new CursorPage<T>
        {
            Data = rows,
            Total = total,
            // point cursor to last item(^1) for the next request 
            NextCursor = hasMore ? cursorOf(rows[^1]) : null,
        };
    }
}
