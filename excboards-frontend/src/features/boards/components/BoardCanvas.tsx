import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type JSX,
  type ReactNode,
} from "react";
import { TriangleAlertIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CaptureUpdateAction,
  Excalidraw,
  isElementLink,
  hashElementsVersion,
  reconcileElements,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import "@excalidraw/excalidraw/index.css";
import { useTheme } from "@/components/theme-provider";
import { getErrorMessage, getErrorStatus } from "@/lib/api";
import {
  getBoardScene,
  saveScene as putScene,
  type SceneApiBase,
  type SceneSaveKind,
} from "../api";
import {
  getReferencedFileIds,
  hydrateBoardFiles,
  uploadBoardFile,
} from "../fileSync";
import { useSaveScene } from "../queries";
import { formatMB, MAX_SCENE_BYTES, UploadLimitError } from "../uploadLimits";
import { useCanvasHub } from "../useCanvasHub";
import {
  appStateFromView,
  buildElementLink,
  ELEMENT_PARAM,
  parseViewParam,
  VIEW_PARAM,
  viewFromAppState,
} from "../viewLink";
import { CopyViewLinkButton, CopyViewLinkToolButton } from "./CopyViewLinkButton";

const SAVE_DEBOUNCE_MS = 3000;

// Browsers cap keepalive request bodies at 64 KiB (shared by all in-flight keepalive
// requests), so the tab-close save must fit under this, multipart overhead included.
const KEEPALIVE_BODY_BUDGET = 60 * 1024;

// Hides "Open" (and Ctrl+O). Dropping a scene file is blocked separately, see blockSceneFileDrop.
const NO_LOAD_SCENE_UI = { canvasActions: { loadScene: false } } as const;

// Excalidraw loads a dropped .excalidraw/.json file as a whole-scene replace regardless of
// UIOptions; stop non-image file drops before they reach it. Image drops still go through.
function blockSceneFileDrop(e: DragEvent<HTMLDivElement>) {
  const files = [...e.dataTransfer.files];
  if (files.some((file) => !file.type.startsWith("image/"))) {
    e.preventDefault();
    e.stopPropagation();
  }
}

// Fixed toast id so repeated debounced saves of an oversized board show one toast, not a stack.
function notifySceneTooLarge() {
  toast.error(
    `This board is too large to save (max ${formatMB(MAX_SCENE_BYTES)}). Remove some elements to keep saving.`,
    { id: "scene-too-large" }
  );
}

interface SceneSnapshot {
  elements: readonly OrderedExcalidrawElement[];
  appState: AppState;
  files: BinaryFiles;
}

function buildScene(scene: SceneSnapshot) {
  const json = serializeAsJSON(
    scene.elements,
    scene.appState,
    scene.files,
    "database"
  );
  const data = JSON.parse(json);
  return {
    data,
    blob: new Blob([json], { type: "application/json" }),
    hash: hashElementsVersion(data.elements ?? []) as number,
  };
}

interface BoardCanvasProps {
  boardId: string;
  /** Endpoint family the scene/files are loaded from and saved to. */
  apiBase: SceneApiBase;
  /** Query-cache key holding the scene, kept in sync with local saves. */
  sceneQueryKey: QueryKey;
  sceneData: ExcalidrawInitialDataState;
  /** Local edits are allowed but never saved or broadcast. */
  cannotEdit: boolean;
  realtimeEnabled: boolean;
  viewModeEnabled?: boolean;
  renderTopRightUI?: (isMobile: boolean) => JSX.Element | null;
  /** Canonical path for "copy link to this view" (stable even if the current URL isn't). */
  boardPath: string;
  /** Allow replacing the whole scene from a file (menu "Open", Ctrl+O, file drop). */
  allowOpenFile?: boolean;
  /** Overlays rendered above the canvas. */
  children?: ReactNode;
}

/**
 * Excalidraw canvas wired to the scene/file endpoints: debounced saves,
 * save-on-leave, file upload/hydration and (optionally) live SignalR sync.
 */
export function BoardCanvas({
  boardId,
  apiBase,
  sceneQueryKey,
  sceneData,
  cannotEdit,
  realtimeEnabled,
  viewModeEnabled,
  renderTopRightUI,
  boardPath,
  allowOpenFile = true,
  children,
}: BoardCanvasProps) {
  const saveScene = useSaveScene();
  const queryClient = useQueryClient();

  const [editBlocked, setEditBlocked] = useState(false);

  const cannotEditRef = useRef(cannotEdit);
  cannotEditRef.current = cannotEdit;

  // Callers build the key inline; keep one stable reference for the effects.
  const sceneQueryKeyRef = useRef(sceneQueryKey);
  sceneQueryKeyRef.current = sceneQueryKey;

  const { resolvedTheme } = useTheme();

  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  // `?view=x,y,zoom` from a shared link, applied once Excalidraw has finished loading.
  const [searchParams] = useSearchParams();
  const pendingViewRef = useRef(parseViewParam(searchParams.get(VIEW_PARAM)));
  // `?element=id` (Excalidraw's "Copy link to object"); takes precedence over `view`.
  const pendingElementRef = useRef(searchParams.get(ELEMENT_PARAM));
  const navigate = useNavigate();

  /** Scroll to an element (or every element of a group) and select it when editable. */
  const focusElement = useCallback((elementOrGroupId: string) => {
    const excalidrawApi = excalidrawApiRef.current;
    if (!excalidrawApi) return;

    const targets = excalidrawApi
      .getSceneElements()
      .filter(
        (el) => el.id === elementOrGroupId || el.groupIds.includes(elementOrGroupId)
      );
    if (targets.length === 0) {
      toast.error("The linked element no longer exists on this board.");
      return;
    }

    excalidrawApi.scrollToContent(targets, {
      fitToViewport: true,
      viewportZoomFactor: 0.6,
      // Don't blow a small shape up to fill the screen.
      maxZoom: 2,
      animate: true,
    });
    if (!excalidrawApi.getAppState().viewModeEnabled) {
      excalidrawApi.updateScene({
        appState: {
          selectedElementIds: Object.fromEntries(targets.map((el) => [el.id, true])),
        },
        captureUpdate: CaptureUpdateAction.NEVER,
      });
    }
  }, []);

  const getCurrentView = useCallback(() => {
    const appState = excalidrawApiRef.current?.getAppState();
    return appState ? viewFromAppState(appState) : null;
  }, []);
  const elementVersionsRef = useRef(new Map<string, number>());
  // Ids of the non-deleted elements seen in the last onChange — used to tell a
  // whole-scene swap (open .excalidraw file: every id is new) apart from a
  // select-all edit (same ids, bumped versions).
  const liveElementIdsRef = useRef(new Set<string>());

  const knownFileIdsRef = useRef(new Set<string>());

  // Let a later scene update retry files that never became available.
  const forgetFailedFileIds = useCallback((failedIds: string[]) => {
    for (const id of failedIds) knownFileIdsRef.current.delete(id);
  }, []);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hashes this client pushed, so its own `SceneSaved` echoes don't trigger a
  // self-refetch (which would clobber edits made since the save fired).
  const ownSavedHashesRef = useRef(new Set<number>());

  const latestSceneRef = useRef<SceneSnapshot | null>(null);

  // Local edits bump editGen; a successful save acknowledges the gen it was built
  // from. editGen > savedGen means there are edits the server hasn't stored yet.
  const editGenRef = useRef(0);
  const savedGenRef = useRef(0);
  const hasUnsavedEdits = () => editGenRef.current > savedGenRef.current;

  const markEdited = () => {
    editGenRef.current++;
  };

  /** A scene that fits a keepalive request, or null if it can't be saved on tab close. */
  function buildUnloadBody(): { body: Blob; hash: number } | null {
    const snapshot = latestSceneRef.current;
    if (!snapshot) return null;
    const { blob, hash } = buildScene(snapshot);
    return blob.size <= KEEPALIVE_BODY_BUDGET ? { body: blob, hash } : null;
  }

  const performSave = useCallback(
    (kind: SceneSaveKind = "Incremental") => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      const snapshot = latestSceneRef.current;
      if (!snapshot) return;

      if (cannotEditRef.current) {
        setEditBlocked(true);
        return;
      }
      const { data, blob, hash } = buildScene(snapshot);
      if (blob.size > MAX_SCENE_BYTES) {
        notifySceneTooLarge();
        return;
      }

      const gen = editGenRef.current;
      ownSavedHashesRef.current.add(hash);
      queryClient.setQueryData(sceneQueryKeyRef.current, data);
      saveScene.mutate(
        { id: boardId, scene: blob, sceneHash: hash, kind, base: apiBase },
        {
          onSuccess: () => {
            savedGenRef.current = Math.max(savedGenRef.current, gen);
          },
          onError: (err) => {
            const status = getErrorStatus(err);
            if (status === 403) setEditBlocked(true);
            else if (status === 413) notifySceneTooLarge();
          },
        }
      );
    },
    [boardId, apiBase, saveScene, queryClient]
  );

  // Read from listeners registered once, so they always call the current version.
  const performSaveRef = useRef(performSave);
  performSaveRef.current = performSave;

  const scheduleSave = useCallback(() => {
    markEdited();
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(
      () => performSave("Incremental"),
      SAVE_DEBOUNCE_MS
    );
  }, [performSave]);

  const onElementsUpdated = useCallback(
    (remoteElements: OrderedExcalidrawElement[]) => {
      const excalidrawApi = excalidrawApiRef.current;
      if (!excalidrawApi) return;

      const localElements = excalidrawApi.getSceneElementsIncludingDeleted();
      const reconciled = reconcileElements(
        localElements,
        remoteElements as RemoteExcalidrawElement[],
        excalidrawApi.getAppState()
      );

      for (const el of reconciled)
        elementVersionsRef.current.set(el.id, el.version);

      excalidrawApi.updateScene({
        elements: reconciled,
        captureUpdate: CaptureUpdateAction.NEVER,
      });

      const missingFileIds = getReferencedFileIds(remoteElements).filter(
        (id) => !knownFileIdsRef.current.has(id)
      );
      if (missingFileIds.length > 0) {
        for (const id of missingFileIds) knownFileIdsRef.current.add(id);
        hydrateBoardFiles(boardId, missingFileIds, excalidrawApi, apiBase)
          .then(forgetFailedFileIds)
          .catch(
          (err) => {
            console.error("Failed to load board files", err);
          }
        );
      }
    },
    [boardId, apiBase, forgetFailedFileIds]
  );

  // handled by socket which called after board scene saved
  const onSceneSaved = useCallback(
    async (sceneHash: number, kind: string) => {
      const excalidrawApi = excalidrawApiRef.current;
      if (!excalidrawApi) return;

      // Our own save echoing back.
      if (ownSavedHashesRef.current.delete(sceneHash)) return;

      if (hashElementsVersion(excalidrawApi.getSceneElements()) === sceneHash) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        savedGenRef.current = editGenRef.current;
        return;
      }

      let fresh;
      try {
        fresh = await getBoardScene(boardId, apiBase);
      } catch (err) {
        console.error("Failed to refetch board scene", err);
        return;
      }

      const stored = (fresh.elements ?? []) as OrderedExcalidrawElement[];
      queryClient.setQueryData(sceneQueryKeyRef.current, fresh);

      const nextElements =
        kind === "Replace"
          ? stored
          : (reconcileElements(
              excalidrawApi.getSceneElementsIncludingDeleted(),
              stored as RemoteExcalidrawElement[],
              excalidrawApi.getAppState()
            ) as unknown as OrderedExcalidrawElement[]);

      elementVersionsRef.current = new Map(
        nextElements.map((el) => [el.id, el.version])
      );

      excalidrawApi.updateScene({
        elements: nextElements,
        captureUpdate: CaptureUpdateAction.NEVER,
      });

      if (kind !== "Replace" && !cannotEditRef.current) {
        const mergedHash = hashElementsVersion(
          nextElements.filter((el) => !el.isDeleted)
        );
        if (mergedHash !== sceneHash) scheduleSave();
      }

      const missingFileIds = getReferencedFileIds(nextElements).filter(
        (id) => !knownFileIdsRef.current.has(id)
      );
      if (missingFileIds.length > 0) {
        for (const id of missingFileIds) knownFileIdsRef.current.add(id);
        hydrateBoardFiles(boardId, missingFileIds, excalidrawApi, apiBase)
          .then(forgetFailedFileIds)
          .catch(
          (err) => {
            console.error("Failed to load board files", err);
          }
        );
      }
    },
    [boardId, apiBase, queryClient, scheduleSave, forgetFailedFileIds]
  );

  const { broadcastElements } = useCanvasHub(
    boardId,
    onElementsUpdated,
    onSceneSaved,
    realtimeEnabled
  );

  // called on every excalidraw change(text/displacement of element etc.)
  function handleChange(
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) {
    latestSceneRef.current = { elements, appState, files };

    // Before isLoading clears, Excalidraw's own init would overwrite the scroll/zoom.
    if (!appState.isLoading && excalidrawApiRef.current) {
      const pendingElement = pendingElementRef.current;
      const pendingView = pendingViewRef.current;
      pendingElementRef.current = null;
      pendingViewRef.current = null;

      if (pendingElement) {
        focusElement(pendingElement);
      } else if (pendingView) {
        excalidrawApiRef.current.updateScene({
          appState: appStateFromView(pendingView, appState),
          captureUpdate: CaptureUpdateAction.NEVER,
        });
      }
    }

    const prevLiveIds = liveElementIdsRef.current;
    const liveIds = new Set(elements.map((el) => el.id));
    liveElementIdsRef.current = liveIds;

    const changed = elements.filter(
      (el) => elementVersionsRef.current.get(el.id) !== el.version
    );
    if (changed.length > 0) {
      for (const el of changed)
        elementVersionsRef.current.set(el.id, el.version);

      const replacedWholesale =
        prevLiveIds.size > 0 &&
        [...prevLiveIds].every((id) => !liveIds.has(id));

      if (cannotEditRef.current) {
        setEditBlocked(true);
      } else if (replacedWholesale) {
        markEdited();
        performSave("Replace");
      } else {
        broadcastElements(changed);
        scheduleSave();
      }
    }

    for (const [fileId, file] of Object.entries(files)) {
      if (knownFileIdsRef.current.has(fileId)) continue;

      knownFileIdsRef.current.add(fileId);
      uploadBoardFile(boardId, file, apiBase).catch((err) => {
        console.error("Failed to upload board file", err);
        // Other collaborators (and reloads) will show this image as missing.
        toast.error(
          err instanceof UploadLimitError
            ? err.message
            : getErrorMessage(err, "Couldn't save an image to the board.")
        );
      });
    }
  }

  useEffect(() => {
    const sceneUrl = `${import.meta.env.VITE_API_BASE_URL}${apiBase}/${boardId}/scene`;

    // Tab switch / app backgrounded (often the last reliable event on mobile):
    // the page is still alive, so flush the pending debounced save normally.
    function flushOnHidden() {
      if (document.visibilityState === "hidden" && saveTimeoutRef.current)
        performSaveRef.current("Incremental");
    }

    // Tab close / reload: only a keepalive request survives, capped at ~64 KB.
    function saveOnUnload() {
      if (!hasUnsavedEdits() || cannotEditRef.current) return;
      const payload = buildUnloadBody();
      if (!payload) return;

      const form = new FormData();
      form.append("Scene", payload.body, "scene.json");
      form.append("SceneHash", String(payload.hash));
      form.append("Kind", "Incremental");
      fetch(sceneUrl, {
        method: "POST",
        body: form,
        credentials: "include",
        keepalive: true,
      }).catch(() => undefined);
    }

    // Too big for keepalive: start a normal save now and let the browser ask before
    // leaving. If the user stays, the save finishes; if they leave, they were warned.
    function warnIfUnsaveable(e: BeforeUnloadEvent) {
      if (!hasUnsavedEdits() || cannotEditRef.current) return;
      if (buildUnloadBody()) return;
      performSaveRef.current("Incremental");
      e.preventDefault();
    }

    document.addEventListener("visibilitychange", flushOnHidden);
    window.addEventListener("pagehide", saveOnUnload);
    window.addEventListener("beforeunload", warnIfUnsaveable);
    return () => {
      document.removeEventListener("visibilitychange", flushOnHidden);
      window.removeEventListener("pagehide", saveOnUnload);
      window.removeEventListener("beforeunload", warnIfUnsaveable);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      // In-app navigation: the page stays alive, so a normal request has no size cap.
      const snapshot = latestSceneRef.current;
      if (!snapshot || !hasUnsavedEdits() || cannotEditRef.current) return;
      const { data, blob, hash } = buildScene(snapshot);
      if (blob.size > MAX_SCENE_BYTES) return;
      queryClient.setQueryData(sceneQueryKeyRef.current, data);
      putScene(boardId, blob, hash, "Incremental", apiBase).catch((err) => {
        console.error("Failed to save board on leave", err);
      });
    };
    // hasUnsavedEdits/buildUnloadBody only read refs.
  }, [boardId, apiBase, queryClient]);

  return (
    <div
      className="relative min-h-0 min-w-0 flex-1"
      onDropCapture={allowOpenFile ? undefined : blockSceneFileDrop}
    >
      {children}
      <CopyViewLinkToolButton path={boardPath} getView={getCurrentView} />

      {editBlocked && (
        <div
          role="alert"
          className="absolute bottom-4 left-1/2 z-10 flex max-w-md -translate-x-1/2 items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive shadow-md"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            {
              "You don't have permission to edit this board. Your changes won't be saved and will be discarded when the board reloads."
            }
          </span>
          <button
            type="button"
            onClick={() => setEditBlocked(false)}
            aria-label="Dismiss"
            className="shrink-0"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      )}

      <Excalidraw
        theme={resolvedTheme}
        viewModeEnabled={viewModeEnabled}
        renderTopRightUI={(isMobile) => (
          <div className="flex items-center gap-2">
            {!isMobile && (
              <CopyViewLinkButton path={boardPath} getView={getCurrentView} />
            )}
            {renderTopRightUI?.(isMobile)}
          </div>
        )}
        excalidrawAPI={(excalidrawApi) => {
          excalidrawApiRef.current = excalidrawApi;

          const initialElements = sceneData.elements ?? [];
          for (const el of initialElements) {
            elementVersionsRef.current.set(el.id, el.version);
            if (!el.isDeleted) liveElementIdsRef.current.add(el.id);
          }

          const referencedFileIds = getReferencedFileIds(initialElements);
          for (const id of referencedFileIds) knownFileIdsRef.current.add(id);
          if (referencedFileIds.length > 0) {
            hydrateBoardFiles(boardId, referencedFileIds, excalidrawApi, apiBase)
              .then(forgetFailedFileIds)
              .catch(
              (err) => {
                console.error("Failed to load board files", err);
              }
            );
          }
        }}
        initialData={sceneData}
        UIOptions={allowOpenFile ? undefined : NO_LOAD_SCENE_UI}
        // Point object links at the board's canonical path, not the current URL
        // (which may be /world or still carry ?view=).
        generateLinkForSelection={(id) => buildElementLink(boardPath, id)}
        onLinkOpen={(element, event) => {
          const link = element.link;
          if (!link || !isElementLink(link)) return;
          // Links within the app: handle in place / via the router instead of a reload.
          event.preventDefault();
          const url = new URL(link);
          const elementId = url.searchParams.get(ELEMENT_PARAM);
          if (url.pathname === boardPath && elementId) focusElement(elementId);
          else navigate(url.pathname + url.search);
        }}
        onChange={handleChange}
      />
    </div>
  );
}
