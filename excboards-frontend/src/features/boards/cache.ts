import type { QueryClient } from "@tanstack/react-query";

/** Any cached board shape: summaries use `id`, bookmark rows use `boardId`. */
type CachedBoard = { name: string; id?: string; boardId?: string };

function isBoard(value: unknown): value is CachedBoard {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    ("id" in value || "boardId" in value)
  );
}

/**
 * Patches every cached copy of one board: the single board, board lists,
 * search hits and bookmark rows. Other cached data (thumbnails, scenes) is left as is.
 */
export function updateCachedBoard<T extends object>(
  queryClient: QueryClient,
  boardId: string,
  patch: (board: T) => T
) {
  const matches = (value: unknown): value is CachedBoard & T =>
    isBoard(value) && (value.boardId ?? value.id) === boardId;

  const update = (data: unknown): unknown => {
    if (matches(data)) return patch(data);
    if (typeof data !== "object" || data === null) return data;

    // "Load more" lists (useInfiniteQuery): { pages: [envelope, ...], pageParams }
    if ("pages" in data && Array.isArray(data.pages)) {
      const pages = data.pages.map(update);
      return pages.some((page, i) => page !== (data.pages as unknown[])[i])
        ? { ...data, pages }
        : data;
    }

    // A list envelope ({ result: [...] }), possibly wrapped like search's { mode, envelope }.
    if ("envelope" in data) {
      const envelope = update(data.envelope);
      return envelope === data.envelope ? data : { ...data, envelope };
    }
    if ("result" in data && Array.isArray(data.result) && data.result.some(matches)) {
      return {
        ...data,
        result: data.result.map((item) => (matches(item) ? patch(item) : item)),
      };
    }
    return data;
  };

  queryClient.setQueriesData(
    {
      predicate: (query) =>
        ["boards", "search", "bookmarks"].includes(query.queryKey[0] as string),
    },
    update
  );
}
