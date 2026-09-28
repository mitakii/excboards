import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { isAxiosError } from "axios";
import { api, type PagedEnvelope } from "@/lib/api";

/** Board-like resources sharing the scene/file endpoint shape. */
export type SceneApiBase = "/api/boards" | "/api/worldboard";
export const BOARDS_API: SceneApiBase = "/api/boards";

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
  tags: string[],
  scene: Blob
) {
  const form = new FormData();
  form.append("Name", name);
  form.append("Description", description);
  for (const tag of tags) form.append("Tags", tag);
  form.append("Scene", scene, "scene.json");

  const res = await api.post<string>("/api/boards", form);
  return res.data;
}

export async function getBoard(id: string) {
  const res = await api.get<Board>(`/api/boards/${id}`);
  return res.data;
}

export async function getBoardScene(id: string, base = BOARDS_API) {
  const res = await api.get(`${base}/${id}/scene`);
  return res.data as unknown as ExcalidrawInitialDataState;
}

/** Mirrors backend Contracts.Boards.SceneSaveKind. */
export type SceneSaveKind = "Incremental" | "Replace";

export async function saveScene(
  id: string,
  scene: Blob,
  sceneHash: number,
  kind: SceneSaveKind = "Incremental",
  base = BOARDS_API
) {
  const form = new FormData();
  form.append("Scene", scene, "scene.json");
  form.append("SceneHash", String(sceneHash));
  form.append("Kind", kind);
  await api.put(`${base}/${id}/scene`, form);
}

export async function deleteBoard(id: string) {
  await api.delete(`/api/boards/${id}`);
}

export async function publishBoard(id: string) {
  await api.patch(`/api/boards/publish/${id}`);
}

export interface BoardThumbnail {
  boardId: string;
  position: number;
  uploadUrl?: string;
  downloadUrl?: string;
}

/** Mirrors backend Application.Boards.BoardThumbnailService.MaxThumbnails. */
export const MAX_BOARD_THUMBNAILS = 5;

export async function addBoardThumbnail(boardId: string) {
  const res = await api.post<BoardThumbnail>(`/api/thumbnail/${boardId}`);
  return res.data;
}

export async function listBoardThumbnails(boardId: string) {
  const res = await api.get<BoardThumbnail[]>(`/api/thumbnail/${boardId}`);
  return res.data;
}

export async function uploadBoardThumbnail(boardId: string, file: File) {
  const { uploadUrl } = await addBoardThumbnail(boardId);
  if (!uploadUrl) throw new Error("No upload URL returned for thumbnail.");
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
}

export async function getBoardThumbnail(
  boardId: string,
  position = 1
): Promise<BoardThumbnail | null> {
  try {
    const res = await api.get<BoardThumbnail>(
      `/api/thumbnail/${boardId}/${position}`
    );
    return res.data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

export async function deleteBoardThumbnail(boardId: string, position: number) {
  await api.delete(`/api/thumbnail/${boardId}/${position}`);
}

export async function getUploadUrl(
  boardId: string,
  fileId: string,
  base = BOARDS_API
) {
  const res = await api.get<string>(`${base}/${boardId}/uploadUrl/${fileId}`);
  return res.data;
}

export async function getDownloadUrls(
  boardId: string,
  fileIds: string[],
  base = BOARDS_API
) {
  const res = await api.post<Record<string, string>>(
    `${base}/${boardId}/downloadUrls`,
    { fileIds }
  );
  return res.data;
}

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
  permission: number = PermissionLevel.Viewer
) {
  await api.post(`/api/boards/${boardId}/collaborators`, {
    userId,
    permission,
  });
}

export async function updateCollaborator(
  boardId: string,
  userId: string,
  permission: number
) {
  await api.put(`/api/boards/${boardId}/collaborators/${userId}`, {
    permission,
  });
}

export async function removeCollaborator(boardId: string, userId: string) {
  await api.delete(`/api/boards/${boardId}/collaborators/${userId}`);
}

/** Newest boards the caller can see: published, own, or shared with them. */
export async function listLatestBoards(
  page: number,
  pageSize: number
): Promise<PagedEnvelope<Board>> {
  const res = await api.get<PagedEnvelope<Board>>("/api/boards/latest", {
    params: { page, pageSize },
  });
  return res.data;
}

export async function listUserBoards(
  userId: string,
  page: number,
  pageSize: number
): Promise<PagedEnvelope<Board>> {
  try {
    const res = await api.get<PagedEnvelope<Board>>(`/api/boards/u/${userId}`, {
      params: { page, pageSize },
    });
    return res.data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      return { result: [], totalCount: 0, currentPage: page, pageSize };
    }
    throw err;
  }
}
