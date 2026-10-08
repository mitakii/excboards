import type { ExcalidrawImperativeAPI, BinaryFileData, DataURL } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement, FileId } from "@excalidraw/excalidraw/element/types";
import * as boardsApi from "./api";
import {
  BOARD_FILE_TYPES,
  formatMB,
  MAX_FILE_BYTES,
  UploadLimitError,
} from "./uploadLimits";

function blobToDataURL(blob: Blob): Promise<DataURL> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as DataURL);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataURLToBlob(dataURL: string): Promise<Blob> {
  const res = await fetch(dataURL);
  return res.blob();
}

export function getReferencedFileIds(elements: readonly ExcalidrawElement[]): string[] {
  const ids = new Set<string>();
  for (const el of elements) {
    if (!el.isDeleted && el.type === "image" && el.fileId) ids.add(el.fileId);
  }
  return [...ids];
}

export async function uploadBoardFile(
  boardId: string,
  file: BinaryFileData,
  base = boardsApi.BOARDS_API,
) {
  if (!BOARD_FILE_TYPES.has(file.mimeType))
    throw new UploadLimitError(`Images of type ${file.mimeType} can't be saved to the board.`);
  const blob = await dataURLToBlob(file.dataURL);
  if (blob.size > MAX_FILE_BYTES)
    throw new UploadLimitError(`Image is too large to save (max ${formatMB(MAX_FILE_BYTES)}).`);

  // The URL is signed for exactly this Content-Type and size.
  const uploadUrl = await boardsApi.getUploadUrl(boardId, file.id, blob.size, file.mimeType, base);
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": file.mimeType },
  });
  if (!res.ok) throw new Error(`Upload of file ${file.id} failed with ${res.status}`);
}

// A remote peer broadcasts an image element before its upload finishes, so the
// object may not exist yet (NoSuchKey) — retry with backoff before giving up.
const HYDRATE_RETRY_DELAYS_MS = [500, 1000, 2000, 4000, 8000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Returns the file ids that could not be loaded after all retries.
export async function hydrateBoardFiles(
  boardId: string,
  fileIds: string[],
  excalidrawApi: ExcalidrawImperativeAPI,
  base = boardsApi.BOARDS_API,
): Promise<string[]> {
  let pending = fileIds;

  for (let attempt = 0; pending.length > 0; attempt++) {
    const urls = await boardsApi.getDownloadUrls(boardId, pending, base);
    const results = await Promise.all(
      pending.map(async (id): Promise<BinaryFileData | null> => {
        const url = urls[id];
        if (!url) return null;
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        const dataURL = await blobToDataURL(blob);
        return {
          id: id as FileId,
          dataURL,
          mimeType: (blob.type || "application/octet-stream") as BinaryFileData["mimeType"],
          created: Date.now(),
        };
      }),
    );

    const loaded = results.filter((file): file is BinaryFileData => file != null);
    if (loaded.length > 0) excalidrawApi.addFiles(loaded);

    pending = pending.filter((_, i) => results[i] == null);
    if (pending.length === 0 || attempt >= HYDRATE_RETRY_DELAYS_MS.length) break;
    await sleep(HYDRATE_RETRY_DELAYS_MS[attempt]);
  }

  return pending;
}
