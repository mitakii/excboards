import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";

export interface BoardTag {
  id: string;
  name: string;
}

export interface Board {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  created: string;
  updated: string;
  tags: BoardTag[];
}

/** Mirrors backend Domain.Enums.PermissionLevel (serialized as a number). */
export const PermissionLevel = {
  Viewer: 0,
  Editor: 1,
  Admin: 2,
} as const;

export interface BoardCollaborator {
  boardId: string;
  userId: string;
  username: string;
  profilePictureUrl: string;
  created: string;
  permission: "Viewer" | "Editor" | "Admin";
}

export async function createBoard(
  name: string,
  description: string,
  scene: Blob
) {
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

export async function saveScene(id: string, scene: Blob, sceneHash: number) {
  const form = new FormData();
  form.append("Scene", scene, "scene.json");
  form.append("SceneHash", String(sceneHash));
  await api.put(`/api/boards/${id}/scene`, form);
}

export async function deleteBoard(id: string) {
  await api.delete(`/api/boards/${id}`);
}

export async function publishBoard(id: string) {
  await api.patch(`/api/boards/publish/${id}`);
}

export async function getUploadUrl(boardId: string, fileId: string) {
  const res = await api.get<string>(
    `/api/boards/${boardId}/uploadUrl/${fileId}`
  );
  return res.data;
}

export async function getDownloadUrls(boardId: string, fileIds: string[]) {
  const res = await api.post<Record<string, string>>(
    `/api/boards/${boardId}/downloadUrls`,
    { fileIds }
  );
  return res.data;
}

// todo:backend
export async function updateBoard(
  id: string,
  data: { name: string; description: string; tags: string[] }
) {
  await api.patch(`/api/boards/${id}`, data);
}

export async function getBoardCollaborators(boardId: string) {
  const res = await api.get<BoardCollaborator[]>(
    `/api/boards/${boardId}/collaborators`
  );
  return res.data;
}

export async function addCollaborator(
  boardId: string,
  userId: string,
  permission: number = PermissionLevel.Editor
) {
  await api.post(`/api/boards/${boardId}/collaborators`, { userId, permission });
}

export async function removeCollaborator(boardId: string, userId: string) {
  await api.delete(`/api/boards/${boardId}/collaborators/${userId}`);
}

export async function listUserBoards(
  userId: string,
  page: number,
  pageSize: number
) {
  try {
    const res = await api.get<Board[]>(`/api/boards/u/${userId}`, {
      params: { page, pageSize },
    });
    return res.data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) return [];
    throw err;
  }
}
