import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateCachedBoard } from "@/features/boards/cache";
import { createDebouncedToggle } from "@/lib/debouncedToggle";
import * as likesApi from "./api";

type LikeFields = { likesCount: number; isLiked: boolean | null };

const toggleLike = createDebouncedToggle((boardId, liked) =>
  liked ? likesApi.likeBoard(boardId) : likesApi.unlikeBoard(boardId)
);

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useCallback(
    (boardId: string, liked: boolean, onError?: (err: unknown) => void) =>
      toggleLike(boardId, liked, {
        // count moves with the heart; only adjust when the state actually changes
        apply: (value) =>
          updateCachedBoard<LikeFields>(queryClient, boardId, (board) =>
            board.isLiked === value
              ? board
              : {
                  ...board,
                  isLiked: value,
                  likesCount: Math.max(0, board.likesCount + (value ? 1 : -1)),
                }
          ),
        // others like boards too; take the server's count once our clicks have settled
        onSuccess: (state, isLatest) => {
          if (!isLatest) return;
          updateCachedBoard<LikeFields>(queryClient, boardId, (board) => ({
            ...board,
            likesCount: state.likesCount,
            isLiked: state.isLiked,
          }));
        },
        onError,
      }),
    [queryClient]
  );
}
