import type { InfiniteData } from "@tanstack/react-query";
import type { CursorEnvelope } from "@/lib/api";

/** Shared useInfiniteQuery options for cursor ("load more") endpoints. */
export const cursorPageParams = {
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (last: CursorEnvelope<unknown>) => last.nextCursor ?? undefined,
};

/**
 * Loaded pages as one list. Keyset paging shouldn't repeat rows, but a row whose sort
 * key changes between loads (e.g. a board edited mid-scroll) could, so drop repeats.
 */
export function flattenCursorPages<T>(
  data: InfiniteData<CursorEnvelope<T>> | undefined,
  keyOf: (item: T) => string
): { items: T[]; total: number } {
  const seen = new Set<string>();
  const items: T[] = [];
  for (const page of data?.pages ?? []) {
    for (const item of page.result) {
      const key = keyOf(item);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }
  // Only the first page carries the total.
  const total = data?.pages[0]?.totalCount ?? items.length;
  return { items, total: Math.max(total, items.length) };
}
