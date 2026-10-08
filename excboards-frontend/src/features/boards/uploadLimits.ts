/** Mirrors backend UploadLimits (appsettings) and Application.Storage.UploadValidator. */
const MB = 1024 * 1024;

export const MAX_SCENE_BYTES = 5 * MB;
export const MAX_FILE_BYTES = 4 * MB;
export const MAX_THUMBNAIL_BYTES = 1 * MB;

export const BOARD_FILE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);
export const THUMBNAIL_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const formatMB = (bytes: number) => `${Math.round(bytes / MB)} MB`;

/** Thrown before any request is made when a file breaks a limit; `message` is user-facing. */
export class UploadLimitError extends Error {}
