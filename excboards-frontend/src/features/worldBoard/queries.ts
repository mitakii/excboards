import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getBoardScene } from "@/features/boards/api";
import * as worldBoardApi from "./api";

const ARCHIVE_PAGE_SIZE = 12;

export function useCurrentWorldBoard(enabled = true) {
  return useQuery({
    queryKey: ["worldBoards", "current"],
    queryFn: worldBoardApi.getCurrentWorldBoard,
    enabled,
    staleTime: 60_000,
  });
}

export function useWorldBoard(id: string | undefined) {
  return useQuery({
    queryKey: ["worldBoards", id],
    queryFn: () => worldBoardApi.getWorldBoard(id!),
    enabled: !!id,
  });
}

export function useWorldBoardScene(id: string | undefined) {
  return useQuery({
    queryKey: ["worldBoards", id, "scene"],
    queryFn: () => getBoardScene(id!, worldBoardApi.WORLD_BOARD_API),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useArchivedWorldBoards() {
  return useInfiniteQuery({
    queryKey: ["worldBoards", "archive"],
    queryFn: ({ pageParam }) =>
      worldBoardApi.listArchivedWorldBoards(pageParam, ARCHIVE_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.currentPage * last.pageSize < last.totalCount
        ? last.currentPage + 1
        : undefined,
    staleTime: 5 * 60_000,
  });
}
