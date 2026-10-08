import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { isAxiosError } from "axios";
import { api, type PagedEnvelope } from "@/lib/api";
import {
  formatMB,
  MAX_THUMBNAIL_BYTES,
  THUMBNAIL_TYPES,
  UploadLimitError,
} from "./uploadLimits";

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
  likesCount: number;
  /** null when the viewer is anonymous. */
  isLiked: boolean | null;
  isBookmarked: boolean | null;
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

export async function addBoardThumbnail(
  boardId: string,
  size: number,
  mimeType: string
) {
  const res = await api.post<BoardThumbnail>(`/api/thumbnail/${boardId}`, {
    size,
    mimeType,
  });
  return res.data;
}

/** Mirrors backend Application.Boards.BoardThumbnailService.MaxBatchBoards. */
const MAX_THUMBNAIL_BATCH = 50;

interface PendingThumbnailRequest {
  resolve: (thumbnails: BoardThumbnail[]) => void;
  reject: (error: unknown) => void;
}

let pendingThumbnailRequests = new Map<string, PendingThumbnailRequest[]>();
let thumbnailFlushScheduled = false;

async function flushThumbnailRequests() {
  const pending = pendingThumbnailRequests;
  pendingThumbnailRequests = new Map();
  thumbnailFlushScheduled = false;

  const ids = [...pending.keys()];
  for (let i = 0; i < ids.length; i += MAX_THUMBNAIL_BATCH) {
    const chunk = ids.slice(i, i + MAX_THUMBNAIL_BATCH);
    try {
      const res = await api.post<Record<string, BoardThumbnail[]>>(
        "/api/thumbnail/batch",
        { boardIds: chunk }
      );
      // boards the user can't see are left out of the response
      for (const id of chunk)
        pending.get(id)!.forEach((r) => r.resolve(res.data[id] ?? []));
    } catch (err) {
      for (const id of chunk) pending.get(id)!.forEach((r) => r.reject(err));
    }
  }
}

/** Calls made in the same tick (e.g. every BoardCard on a list page) share one batched request. */
export function listBoardThumbnails(boardId: string) {
  return new Promise<BoardThumbnail[]>((resolve, reject) => {
    const waiting = pendingThumbnailRequests.get(boardId) ?? [];
    waiting.push({ resolve, reject });
    pendingThumbnailRequests.set(boardId, waiting);

    if (!thumbnailFlushScheduled) {
      thumbnailFlushScheduled = true;
      setTimeout(flushThumbnailRequests, 0);
    }
  });
}

export async function uploadBoardThumbnail(boardId: string, file: File) {
  if (!THUMBNAIL_TYPES.has(file.type))
    throw new UploadLimitError("Thumbnail must be a PNG, JPEG or WebP image.");
  if (file.size > MAX_THUMBNAIL_BYTES)
    throw new UploadLimitError(
      `Thumbnail is too large (max ${formatMB(MAX_THUMBNAIL_BYTES)}).`
    );

  const { uploadUrl } = await addBoardThumbnail(boardId, file.size, file.type);
  if (!uploadUrl) throw new Error("No upload URL returned for thumbnail.");
  // The URL is signed for exactly this Content-Type and size.
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!res.ok) throw new Error(`Thumbnail upload failed with ${res.status}`);
}

export async function deleteBoardThumbnail(boardId: string, position: number) {
  await api.delete(`/api/thumbnail/${boardId}/${position}`);
}

export async function getUploadUrl(
  boardId: string,
  fileId: string,
  size: number,
  mimeType: string,
  base = BOARDS_API
) {
  const res = await api.post<string>(`${base}/${boardId}/uploadUrl`, {
    fileId,
    size,
    mimeType,
  });
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

/** Mirrors backend Domain.Dto.UserBoardStatsDto; counts public boards only. */
export interface UserBoardStats {
  publicBoards: number;
  likesReceived: number;
  contributedBoards: number;
}

/** Boards owned by others where the user is an Editor/Admin collaborator. */
export async function listUserContributedBoards(
  userId: string,
  page: number,
  pageSize: number
): Promise<PagedEnvelope<Board>> {
  const res = await api.get<PagedEnvelope<Board>>(
    `/api/boards/u/${userId}/contributed`,
    { params: { page, pageSize } }
  );
  return res.data;
}

/** Boards the user liked, newest like first. */
export async function listUserLikedBoards(
  userId: string,
  page: number,
  pageSize: number
): Promise<PagedEnvelope<Board>> {
  const res = await api.get<PagedEnvelope<Board>>(
    `/api/boards/u/${userId}/liked`,
    { params: { page, pageSize } }
  );
  return res.data;
}

export async function getUserBoardStats(userId: string) {
  const res = await api.get<UserBoardStats>(`/api/boards/u/${userId}/stats`);
  return res.data;
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
