import { useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { CaptureUpdateAction, Excalidraw, reconcileElements, serializeAsJSON } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import "@excalidraw/excalidraw/index.css";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { useBoard, useBoardScene, useSaveScene } from "./queries";
import { useCanvasHub } from "./useCanvasHub";
import { BoardSidebar } from "./components/BoardSidebar";

const SAVE_DEBOUNCE_MS = 3000;

function buildSceneBlob(excalidrawApi: ExcalidrawImperativeAPI) {
  const elements = excalidrawApi.getSceneElements();
  const appState = excalidrawApi.getAppState();
  const files = excalidrawApi.getFiles();
  const sceneJson = serializeAsJSON(elements, appState, files, "database");
  return new Blob([sceneJson], { type: "application/json" });
}

export function ViewBoardPage() {
  const { id } = useParams<{ id: string }>();
  const board = useBoard(id);
  const scene = useBoardScene(id);
  const saveScene = useSaveScene();

  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const elementVersionsRef = useRef(new Map<string, number>());
  const applyingRemoteUpdateRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onElementsUpdated = useCallback((remoteElements: OrderedExcalidrawElement[]) => {
    const excalidrawApi = excalidrawApiRef.current;
    if (!excalidrawApi) return;

    const localElements = excalidrawApi.getSceneElementsIncludingDeleted();
    const reconciled = reconcileElements(
      localElements,
      remoteElements as RemoteExcalidrawElement[],
      excalidrawApi.getAppState(),
    );

    for (const el of reconciled) elementVersionsRef.current.set(el.id, el.version);

    applyingRemoteUpdateRef.current = true;
    excalidrawApi.updateScene({ elements: reconciled, captureUpdate: CaptureUpdateAction.NEVER });
  }, []);

  const { broadcastElements } = useCanvasHub(id, onElementsUpdated);

  const scheduleSave = useCallback(() => {
    if (!id) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const excalidrawApi = excalidrawApiRef.current;
      if (!excalidrawApi) return;
      saveScene.mutate({ id, scene: buildSceneBlob(excalidrawApi) });
    }, SAVE_DEBOUNCE_MS);
  }, [id, saveScene]);

  function handleChange(elements: readonly OrderedExcalidrawElement[]) {
    if (applyingRemoteUpdateRef.current) {
      applyingRemoteUpdateRef.current = false;
      return;
    }

    const changed = elements.filter((el) => elementVersionsRef.current.get(el.id) !== el.version);
    if (changed.length > 0) {
      for (const el of changed) elementVersionsRef.current.set(el.id, el.version);
      broadcastElements(changed);
      scheduleSave();
    }
  }

  // Safety net: force a save on tab close / navigation away, since the debounce timer won't fire.
  useEffect(() => {
    if (!id) return;

    function saveOnLeave() {
      const excalidrawApi = excalidrawApiRef.current;
      if (!excalidrawApi) return;
      const form = new FormData();
      form.append("Scene", buildSceneBlob(excalidrawApi), "scene.json");
      // sendBeacon can't do PUT, and this endpoint is a PUT, so use a keepalive fetch instead —
      // the browser keeps the request alive past page unload just like sendBeacon would.
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/boards/${id}/scene`, {
        method: "PUT",
        body: form,
        credentials: "include",
        keepalive: true,
      }).catch(() => undefined);
    }

    window.addEventListener("pagehide", saveOnLeave);
    return () => {
      window.removeEventListener("pagehide", saveOnLeave);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveOnLeave();
    };
  }, [id]);

  if (board.isLoading || scene.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  if (board.isError || scene.isError || !board.data || !scene.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-destructive">
        {getErrorMessage(board.error ?? scene.error, "Failed to load board.")}
      </div>
    );
  }

  return (
    <div className="flex h-svh">
      <BoardSidebar name={board.data.name} description={board.data.description ?? ""} readOnly />
      <div className="min-h-0 min-w-0 flex-1">
        <Excalidraw
          excalidrawAPI={(excalidrawApi) => {
            excalidrawApiRef.current = excalidrawApi;
            for (const el of excalidrawApi.getSceneElementsIncludingDeleted()) {
              elementVersionsRef.current.set(el.id, el.version);
            }
          }}
          initialData={scene.data}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
