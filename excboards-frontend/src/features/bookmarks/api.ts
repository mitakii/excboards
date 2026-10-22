import { api, type CursorEnvelope } from "@/lib/api";
import type { BoardTag } from "@/features/boards/api";

/** Mirrors backend Domain.Dto.BookmarkedBoardDto. */
export interface BookmarkedBoard {
  boardId: string;
  ownerId: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  bookmarkedAt: string;
  tags: BoardTag[];
  /** Not sent by the backend; written into the cache when the bookmark is toggled off. */
  isBookmarked?: boolean;
}

/** Newest bookmark first; boards the user can no longer see are left out. */
export async function listBookmarkedBoards(
  cursor: string | undefined,
  pageSize: number
): Promise<CursorEnvelope<BookmarkedBoard>> {
  const res = await api.get<CursorEnvelope<BookmarkedBoard>>("/api/bookmarks", {
    params: { cursor, pageSize },
  });
  return res.data;
}

/** Idempotent: bookmarking an already bookmarked board is a no-op. */
export async function addBookmark(boardId: string) {
  await api.put(`/api/bookmarks/${boardId}`);
}

export async function removeBookmark(boardId: string) {
  await api.delete(`/api/bookmarks/${boardId}`);
}
