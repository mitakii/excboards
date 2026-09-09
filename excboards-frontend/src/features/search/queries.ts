import { keepPreviousData, useQuery } from "@tanstack/react-query";
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

export function useSearch(raw: string, page = 1, pageSize = 10) {
  const parsed = parseSearchQuery(raw);
  const { mode, term, tags } = parsed;
  const enabled = term.length > 0;

  const query = useQuery<SearchData>({
    queryKey: ["search", mode, term, page, pageSize],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (mode === "user") {
        return {
          mode,
          envelope: await searchApi.searchUsers(term, page, pageSize),
        };
      }
      if (mode === "tag") {
        return {
          mode,
          envelope: await searchApi.searchBoardsByTags(tags, page, pageSize),
        };
      }
      return {
        mode,
        envelope: await searchApi.searchBoards(term, page, pageSize),
      };
    },
  });

  return { parsed, enabled, ...query };
}
