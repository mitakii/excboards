import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { cursorPageParams } from "@/lib/cursorPaging";
import * as searchApi from "./api";
import { parseSearchQuery } from "./parseQuery";
import type {
  BoardSearchResult,
  SearchEnvelope,
  UserSearchResult,
} from "./api";

type SearchData =
  | { mode: "user"; envelope: SearchEnvelope<UserSearchResult> }
  | { mode: "tag"; envelope: SearchEnvelope<BoardSearchResult> }
  | { mode: "board"; envelope: SearchEnvelope<BoardSearchResult> };

function fetchSearch(
  { mode, term, tags }: ReturnType<typeof parseSearchQuery>,
  cursor: string | undefined,
  pageSize: number
): Promise<SearchData> {
  if (mode === "user")
    return searchApi
      .searchUsers(term, cursor, pageSize)
      .then((envelope) => ({ mode, envelope }));
  if (mode === "tag")
    return searchApi
      .searchBoardsByTags(tags, cursor, pageSize)
      .then((envelope) => ({ mode, envelope }));
  return searchApi
    .searchBoards(term, cursor, pageSize)
    .then((envelope) => ({ mode, envelope }));
}

/** First page only, for the search suggestions dropdown. */
export function useSearch(raw: string, pageSize = 10) {
  const parsed = parseSearchQuery(raw);
  const enabled = parsed.term.length > 0;

  const query = useQuery<SearchData>({
    queryKey: ["search", parsed.mode, parsed.term, "first", pageSize],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: () => fetchSearch(parsed, undefined, pageSize),
  });

  return { parsed, enabled, ...query };
}

/** Full results with "load more", for the search page. */
export function useInfiniteSearch(raw: string, pageSize: number) {
  const parsed = parseSearchQuery(raw);
  const enabled = parsed.term.length > 0;

  const query = useInfiniteQuery({
    queryKey: ["search", parsed.mode, parsed.term, "all", pageSize],
    enabled,
    queryFn: ({ pageParam }) => fetchSearch(parsed, pageParam, pageSize),
    initialPageParam: cursorPageParams.initialPageParam,
    getNextPageParam: (last: SearchData) => last.envelope.nextCursor ?? undefined,
  });

  return { parsed, enabled, ...query };
}
