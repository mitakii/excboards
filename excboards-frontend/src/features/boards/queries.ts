import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as boardsApi from "./api";

export function useCreateBoard() {
  return useMutation({
    mutationFn: ({ name, description, scene }: { name: string; description: string; scene: Blob }) =>
      boardsApi.createBoard(name, description, scene),
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
  });
}

export function useSaveScene() {
  return useMutation({
    mutationFn: ({ id, scene }: { id: string; scene: Blob }) => boardsApi.saveScene(id, scene),
  });
}

export function useUserBoards(userId: string | undefined, page: number, pageSize: number) {
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boards", "u"] }),
  });
}
