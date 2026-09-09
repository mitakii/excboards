import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import type { BoardTag } from "@/features/boards/api";

/** Mirrors backend Contracts.Search.SearchResponse<T> (camel-cased). */
export interface SearchEnvelope<T> {
  result: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

/** Mirrors backend Contracts.Boards.BoardResponse. */
export interface BoardSearchResult {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  created: string;
  updated: string;
  tags: BoardTag[];
}

/** Mirrors backend Contracts.User.UserResponse. */
export interface UserSearchResult {
  userId: string;
  username: string;
  email: string;
  createdAtUtc: string;
  profilePictureUrl: string;
}

function emptyEnvelope<T>(page: number, pageSize: number): SearchEnvelope<T> {
  return { result: [], totalCount: 0, currentPage: page, pageSize };
}

/**
 * The backend returns 404 (not an empty list) when a search yields nothing —
 * normalise that to an empty envelope so callers only handle real errors.
 */
async function runSearch<T>(
  resource: "board" | "tag" | "user",
  query: string,
  page: number,
  pageSize: number
) {
  try {
    const res = await api.get<SearchEnvelope<T>>(`/api/search/${resource}`, {
      params: { query, page, pageSize },
    });
    return res.data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      return emptyEnvelope<T>(page, pageSize);
    }
    throw err;
  }
}

export function searchBoards(query: string, page = 1, pageSize = 10) {
  return runSearch<BoardSearchResult>("board", query, page, pageSize);
}

export function searchBoardsByTags(
  tagNames: string[],
  page = 1,
  pageSize = 10
) {
  return runSearch<BoardSearchResult>(
    "tag",
    tagNames.join(" "),
    page,
    pageSize
  );
}

export function searchUsers(query: string, page = 1, pageSize = 10) {
  return runSearch<UserSearchResult>("user", query, page, pageSize);
}
