import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";

export interface Board {
  id: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  created: string;
  updated: string;
}

export async function createBoard(name: string, description: string, scene: Blob) {
  const form = new FormData();
  form.append("Name", name);
  form.append("Description", description);
  form.append("Scene", scene, "scene.json");

  const res = await api.post<string>("/api/boards", form);
  return res.data;
}

export async function getBoard(id: string) {
  const res = await api.get<Board>(`/api/boards/${id}`);
  return res.data;
}

export async function getBoardScene(id: string) {
  const res = await api.get(`/api/boards/${id}/scene`);
  return res.data as unknown as ExcalidrawInitialDataState;
}

export async function saveScene(id: string, scene: Blob) {
  const form = new FormData();
  form.append("Scene", scene, "scene.json");
  await api.put(`/api/boards/${id}/scene`, form);
}

export async function deleteBoard(id: string) {
  await api.delete(`/api/boards/${id}`);
}

export async function listUserBoards(userId: string, page: number, pageSize: number) {
  try {
    const res = await api.get<Board[]>(`/api/boards/u/${userId}`, {
      params: { page, pageSize },
    });
    return res.data;
  } catch (err) {
    // The backend 404s when a user has no (visible) boards at all — treat that as an empty list.
    if (isAxiosError(err) && err.response?.status === 404) return [];
    throw err;
  }
}
