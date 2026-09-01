import { useEffect, useSyncExternalStore } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getRecentBoardIds,
  removeRecentBoard,
  subscribeRecentBoards,
} from "@/lib/recentBoards";
import * as boardsApi from "./api";

export function useCreateBoard() {
  const queryClient = useQueryClient();
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["boards", "u"] }),
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
    mutationFn: ({
      id,
      scene,
      sceneHash,
    }: {
      id: string;
      scene: Blob;
      sceneHash: number;
    }) => boardsApi.saveScene(id, scene, sceneHash),
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

export function usePublishBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => boardsApi.publishBoard(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["boards", id] });
      queryClient.invalidateQueries({ queryKey: ["boards", "u"] });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => boardsApi.deleteBoard(id),
    onSuccess: (_data, id) => {
      removeRecentBoard(id);
      queryClient.removeQueries({ queryKey: ["boards", id] });
      queryClient.invalidateQueries({ queryKey: ["boards", "u"] });
    },
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
      queryClient.invalidateQueries({ queryKey: ["boards", "u"] });
    },
  });
}

export function useBoardCollaborators(id: string | undefined) {
  return useQuery({
    queryKey: ["boards", id, "collaborators"],
    queryFn: () => boardsApi.getBoardCollaborators(id!),
    enabled: !!id,
  });
}

export function useAddCollaborator(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      permission,
    }: {
      userId: string;
      permission?: number;
    }) => boardsApi.addCollaborator(boardId, userId, permission),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["boards", boardId, "collaborators"],
      }),
  });
}

export function useRemoveCollaborator(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      boardsApi.removeCollaborator(boardId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["boards", boardId, "collaborators"],
      }),
  });
}

export function useRecentBoards() {
  const ids = useSyncExternalStore(subscribeRecentBoards, getRecentBoardIds);
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["boards", id],
      queryFn: () => boardsApi.getBoard(id),
      retry: false,
      staleTime: 60_000,
    })),
  });

  const staleIds = ids.filter((_, i) => results[i]?.isError).join(",");
  useEffect(() => {
    if (staleIds) staleIds.split(",").forEach(removeRecentBoard);
  }, [staleIds]);

  return ids
    .map((_, i) => results[i]?.data)
    .filter((board): board is boardsApi.Board => board != null);
}
