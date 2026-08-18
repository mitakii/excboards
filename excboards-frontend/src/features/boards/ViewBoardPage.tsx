import { useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  CaptureUpdateAction,
  Excalidraw,
  reconcileElements,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type {
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import "@excalidraw/excalidraw/index.css";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { addRecentBoard } from "@/lib/recentBoards";
import {
  getReferencedFileIds,
  hydrateBoardFiles,
  uploadBoardFile,
} from "./fileSync";
import { useBoard, useBoardScene, useSaveScene } from "./queries";
import { useCanvasHub } from "./useCanvasHub";

const SAVE_DEBOUNCE_MS = 3000;

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
  return {
    data: JSON.parse(json),
    blob: new Blob([json], { type: "application/json" }),
  };
}

export function ViewBoardPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  return <ViewBoardCanvas key={id} boardId={id} />;
}

function ViewBoardCanvas({ boardId }: { boardId: string }) {
  const board = useBoard(boardId);
  const scene = useBoardScene(boardId);
  const saveScene = useSaveScene();
  const queryClient = useQueryClient();

  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const elementVersionsRef = useRef(new Map<string, number>());

  const knownFileIdsRef = useRef(new Set<string>());
  const applyingRemoteUpdateRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latestSceneRef = useRef<SceneSnapshot | null>(null);

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

      applyingRemoteUpdateRef.current = true;
      excalidrawApi.updateScene({
        elements: reconciled,
        captureUpdate: CaptureUpdateAction.NEVER,
      });

      const missingFileIds = getReferencedFileIds(remoteElements).filter(
        (id) => !knownFileIdsRef.current.has(id)
      );
      if (missingFileIds.length > 0) {
        for (const id of missingFileIds) knownFileIdsRef.current.add(id);
        hydrateBoardFiles(boardId, missingFileIds, excalidrawApi).catch(
          (err) => {
            console.error("Failed to load board files", err);
          }
        );
      }
    },
    [boardId]
  );

  const { broadcastElements } = useCanvasHub(boardId, onElementsUpdated);

  useEffect(() => {
    if (board.data) addRecentBoard(board.data.id);
  }, [board.data]);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const scene = latestSceneRef.current;
      if (!scene) return;
      const { data, blob } = buildScene(scene);

      queryClient.setQueryData(["boards", boardId, "scene"], data);
      saveScene.mutate({ id: boardId, scene: blob });
    }, SAVE_DEBOUNCE_MS);
  }, [boardId, saveScene, queryClient]);

  function handleChange(
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) {
    latestSceneRef.current = { elements, appState, files };

    if (applyingRemoteUpdateRef.current) {
      applyingRemoteUpdateRef.current = false;
      return;
    }

    const changed = elements.filter(
      (el) => elementVersionsRef.current.get(el.id) !== el.version
    );
    if (changed.length > 0) {
      for (const el of changed)
        elementVersionsRef.current.set(el.id, el.version);
      broadcastElements(changed);
      scheduleSave();
    }

    for (const [fileId, file] of Object.entries(files)) {
      if (knownFileIdsRef.current.has(fileId)) continue;

      knownFileIdsRef.current.add(fileId);
      uploadBoardFile(boardId, file).catch((err) => {
        console.error("Failed to upload board file", err);
      });
    }
  }

  useEffect(() => {
    function saveOnLeave() {
      const scene = latestSceneRef.current;
      if (!scene) return;
      const { data, blob } = buildScene(scene);
      queryClient.setQueryData(["boards", boardId, "scene"], data);

      const form = new FormData();
      form.append("Scene", blob, "scene.json");

      fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/boards/${boardId}/scene`,
        {
          method: "PUT",
          body: form,
          credentials: "include",
          keepalive: true,
        }
      ).catch(() => undefined);
    }

    window.addEventListener("pagehide", saveOnLeave);
    return () => {
      window.removeEventListener("pagehide", saveOnLeave);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveOnLeave();
    };
  }, [boardId, queryClient]);

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

  const sceneData = scene.data;

  return (
    <div className="min-h-0 min-w-0 flex-1">
      <Excalidraw
        excalidrawAPI={(excalidrawApi) => {
          excalidrawApiRef.current = excalidrawApi;

          const initialElements = sceneData.elements ?? [];
          for (const el of initialElements) {
            elementVersionsRef.current.set(el.id, el.version);
          }

          const referencedFileIds = getReferencedFileIds(initialElements);
          for (const id of referencedFileIds) knownFileIdsRef.current.add(id);
          if (referencedFileIds.length > 0) {
            hydrateBoardFiles(boardId, referencedFileIds, excalidrawApi).catch(
              (err) => {
                console.error("Failed to load board files", err);
              }
            );
          }
        }}
        initialData={sceneData}
        onChange={handleChange}
      />
    </div>
  );
}
