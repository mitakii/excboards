import type { AppState } from "@excalidraw/excalidraw/types";

/**
 * A shareable board position: the scene point at the centre of the viewport plus
 * the zoom. Centre-based so the same spot shows up on any screen size.
 * Encoded in the URL as `?view=x,y,zoom`.
 */
export interface BoardView {
  x: number;
  y: number;
  zoom: number;
}

export const VIEW_PARAM = "view";

// Excalidraw's own zoom bounds.
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 30;

export function parseViewParam(value: string | null): BoardView | null {
  if (!value) return null;
  const parts = value.split(",").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [x, y, zoom] = parts;
  return { x, y, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)) };
}

export function formatViewParam(view: BoardView): string {
  return `${Math.round(view.x)},${Math.round(view.y)},${Number(view.zoom.toFixed(2))}`;
}

type ViewportState = Pick<AppState, "scrollX" | "scrollY" | "zoom" | "width" | "height">;

// Excalidraw maps scene → screen as (sceneX + scrollX) * zoom.
export function viewFromAppState(appState: ViewportState): BoardView {
  const zoom = appState.zoom.value;
  return {
    x: appState.width / 2 / zoom - appState.scrollX,
    y: appState.height / 2 / zoom - appState.scrollY,
    zoom,
  };
}

export function appStateFromView(
  view: BoardView,
  viewport: Pick<AppState, "width" | "height">
): Pick<AppState, "scrollX" | "scrollY" | "zoom"> {
  return {
    scrollX: viewport.width / 2 / view.zoom - view.x,
    scrollY: viewport.height / 2 / view.zoom - view.y,
    zoom: { value: view.zoom as AppState["zoom"]["value"] },
  };
}

export function buildViewLink(path: string, view: BoardView): string {
  const url = new URL(path, window.location.origin);
  // Assigned directly (not via searchParams) so the commas stay readable instead of %2C.
  url.search = `${VIEW_PARAM}=${formatViewParam(view)}`;
  return url.toString();
}

/** Same key Excalidraw uses for its element links, so its isElementLink() recognises ours. */
export const ELEMENT_PARAM = "element";

/** Link to one element, or a group (id is then a groupId). */
export function buildElementLink(path: string, elementOrGroupId: string): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set(ELEMENT_PARAM, elementOrGroupId);
  return url.toString();
}
