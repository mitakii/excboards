import { useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { cursorPageParams } from "@/lib/cursorPaging";
import { updateCachedBoard } from "@/features/boards/cache";
import { createDebouncedToggle } from "@/lib/debouncedToggle";
import * as bookmarksApi from "./api";

export function useBookmarkedBoards(pageSize: number, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["bookmarks", pageSize],
    queryFn: ({ pageParam }) => bookmarksApi.listBookmarkedBoards(pageParam, pageSize),
    ...cursorPageParams,
    enabled,
  });
}

const toggleBookmark = createDebouncedToggle((boardId, bookmarked) =>
  bookmarked
    ? bookmarksApi.addBookmark(boardId)
    : bookmarksApi.removeBookmark(boardId)
);

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useCallback(
    (boardId: string, bookmarked: boolean, onError?: (err: unknown) => void) =>
      toggleBookmark(boardId, bookmarked, {
        apply: (value) =>
          updateCachedBoard(queryClient, boardId, (board) => ({
            ...board,
            isBookmarked: value,
          })),
        onError,
        onSettled: () =>
          queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
      }),
    [queryClient]
  );
}
