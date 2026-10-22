import { isAxiosError } from "axios";
import { api, emptyCursorEnvelope, type CursorEnvelope } from "@/lib/api";
import type { BoardTag } from "@/features/boards/api";

export type SearchEnvelope<T> = CursorEnvelope<T>;

/** Mirrors backend Domain.Dto.BoardSummaryDto. */
export interface BoardSearchResult {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  created: string;
  updated: string;
  likesCount: number;
  /** null when the viewer is anonymous. */
  isLiked: boolean | null;
  isBookmarked: boolean | null;
  tags: BoardTag[];
}

/** Mirrors backend Application.Dto.UserDto. */
export interface UserSearchResult {
  userId: string;
  username: string;
  createdAtUtc: string;
  profilePictureUrl: string;
}

/**
 * The backend returns 404 (not an empty list) when a search yields nothing —
 * normalise that to an empty envelope so callers only handle real errors.
 */
async function runSearch<T>(
  resource: "board" | "tag" | "user",
  query: string,
  cursor: string | undefined,
  pageSize: number
) {
  try {
    const res = await api.get<SearchEnvelope<T>>(`/api/search/${resource}`, {
      params: { query, cursor, pageSize },
    });
    return res.data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      return emptyCursorEnvelope<T>();
    }
    throw err;
  }
}

export function searchBoards(query: string, cursor?: string, pageSize = 10) {
  return runSearch<BoardSearchResult>("board", query, cursor, pageSize);
}

export function searchBoardsByTags(
  tagNames: string[],
  cursor?: string,
  pageSize = 10
) {
  return runSearch<BoardSearchResult>(
    "tag",
    tagNames.join(" "),
    cursor,
    pageSize
  );
}

export function searchUsers(query: string, cursor?: string, pageSize = 10) {
  return runSearch<UserSearchResult>("user", query, cursor, pageSize);
}
