import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getRecentBoardIds } from "@/lib/recentBoards";
import * as boardsApi from "./api";

export function useCreateBoard() {
  return useMutation({
    mutationFn: ({
      name,
      description,
      scene,
    }: {
      name: string;
      description: string;
      scene: Blob;
    }) => boardsApi.createBoard(name, description, scene),
  });
}

export function useBoard(id: string | undefined) {
  return useQuery({
    queryKey: ["boards", id],
    queryFn: () => boardsApi.getBoard(id!),
    enabled: !!id,
  });
}

export function useBoardScene(id: string | undefined) {
  return useQuery({
    queryKey: ["boards", id, "scene"],
    queryFn: () => boardsApi.getBoardScene(id!),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useSaveScene() {
  return useMutation({
    mutationFn: ({ id, scene }: { id: string; scene: Blob }) =>
      boardsApi.saveScene(id, scene),
  });
}

export function useUserBoards(
  userId: string | undefined,
  page: number,
  pageSize: number
) {
  return useQuery({
    queryKey: ["boards", "u", userId, page, pageSize],
    queryFn: () => boardsApi.listUserBoards(userId!, page, pageSize),
    enabled: !!userId,
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => boardsApi.deleteBoard(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["boards", "u"] }),
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      name,
      description,
      tags,
    }: {
      id: string;
      name: string;
      description: string;
      tags: string[];
    }) => boardsApi.updateBoard(id, { name, description, tags }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["boards", variables.id] });
    },
  });
}

export function useRecentBoards() {
  const ids = getRecentBoardIds();
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["boards", id],
      queryFn: () => boardsApi.getBoard(id),
      retry: false,
      staleTime: 60_000,
    })),
  });

  return ids
    .map((_, i) => results[i]?.data)
    .filter((board): board is boardsApi.Board => board != null);
}
