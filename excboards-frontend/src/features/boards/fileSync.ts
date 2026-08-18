import type { ExcalidrawImperativeAPI, BinaryFileData, DataURL } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement, FileId } from "@excalidraw/excalidraw/element/types";
import * as boardsApi from "./api";

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

export async function uploadBoardFile(boardId: string, file: BinaryFileData) {
  const uploadUrl = await boardsApi.getUploadUrl(boardId, file.id);
  const blob = await dataURLToBlob(file.dataURL);
  await fetch(uploadUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": file.mimeType },
  });
}

export async function hydrateBoardFiles(boardId: string, fileIds: string[], excalidrawApi: ExcalidrawImperativeAPI) {
  if (fileIds.length === 0) return;

  const urls = await boardsApi.getDownloadUrls(boardId, fileIds);
  const files = await Promise.all(
    Object.entries(urls).map(async ([id, url]): Promise<BinaryFileData | null> => {
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

  const loaded = files.filter((file): file is BinaryFileData => file != null);
  if (loaded.length > 0) excalidrawApi.addFiles(loaded);
}
