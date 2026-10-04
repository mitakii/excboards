import { useCallback } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { updateCachedBoard } from "@/features/boards/cache";
import { createDebouncedToggle } from "@/lib/debouncedToggle";
import * as bookmarksApi from "./api";

export function useBookmarkedBoards(
  page: number,
  pageSize: number,
  enabled = true
) {
  return useQuery({
    queryKey: ["bookmarks", page, pageSize],
    queryFn: () => bookmarksApi.listBookmarkedBoards(page, pageSize),
    placeholderData: keepPreviousData,
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
