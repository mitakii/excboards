import { api } from "@/lib/api";

/** Mirrors backend Domain.Dto.BoardLikeStateDto. */
export interface BoardLikeState {
  likesCount: number;
  isLiked: boolean;
}

/** Idempotent: liking an already liked board is a no-op. Returns the fresh count. */
export async function likeBoard(boardId: string) {
  const res = await api.put<BoardLikeState>(`/api/likes/${boardId}`);
  return res.data;
}

export async function unlikeBoard(boardId: string) {
  const res = await api.delete<BoardLikeState>(`/api/likes/${boardId}`);
  return res.data;
}
