import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { InfoIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CaptureUpdateAction,
  Excalidraw,
  hashElementsVersion,
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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage, getErrorStatus } from "@/lib/api";
import { addRecentBoard } from "@/lib/recentBoards";
import { useStatus } from "@/features/auth/queries";
import { getBoardScene, type SceneSaveKind } from "./api";
import {
  getReferencedFileIds,
  hydrateBoardFiles,
  uploadBoardFile,
} from "./fileSync";
import {
  useBoard,
  useBoardCollaborators,
  useBoardScene,
  useSaveScene,
} from "./queries";
import { BoardOverviewDialog } from "./components/BoardOverviewDialog";
import { ExcalidrawMiscToolPortal } from "./components/ExcalidrawMiscToolPortal";
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
  const data = JSON.parse(json);
  return {
    data,
    blob: new Blob([json], { type: "application/json" }),
    hash: hashElementsVersion(data.elements ?? []) as number,
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
  const collaborators = useBoardCollaborators(boardId);
  const saveScene = useSaveScene();
  const { data: user } = useStatus();

  const realtimeEnabled = (collaborators.data?.length ?? 0) > 0;
  const queryClient = useQueryClient();

  const [overviewOpen, setOverviewOpen] = useState(false);
  const [editBlocked, setEditBlocked] = useState(false);

  const isOwner = Boolean(
    user &&
      board.data &&
      user.userId.toLowerCase() === board.data.ownerId.toLowerCase()
  );
  const myPermission = (collaborators.data ?? []).find(
    (c) => user && c.userId.toLowerCase() === user.userId.toLowerCase()
  )?.permission;
  const cannotEdit =
    Boolean(user) &&
    board.isSuccess &&
    collaborators.isSuccess &&
    !isOwner &&
    myPermission !== "Editor" &&
    myPermission !== "Admin";

  const cannotEditRef = useRef(cannotEdit);
  cannotEditRef.current = cannotEdit;

  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const elementVersionsRef = useRef(new Map<string, number>());
  // Ids of the non-deleted elements seen in the last onChange — used to tell a
  // whole-scene swap (open .excalidraw file: every id is new) apart from a
  // select-all edit (same ids, bumped versions).
  const liveElementIdsRef = useRef(new Set<string>());

  const knownFileIdsRef = useRef(new Set<string>());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hashes this client pushed, so its own `SceneSaved` echoes don't trigger a
  // self-refetch (which would clobber edits made since the save fired).
  const ownSavedHashesRef = useRef(new Set<number>());

  const latestSceneRef = useRef<SceneSnapshot | null>(null);

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

      ownSavedHashesRef.current.add(hash);
      queryClient.setQueryData(["boards", boardId, "scene"], data);
      saveScene.mutate(
        { id: boardId, scene: blob, sceneHash: hash, kind },
        {
          onError: (err) => {
            if (getErrorStatus(err) === 403) setEditBlocked(true);
          },
        }
      );
    },
    [boardId, saveScene, queryClient]
  );

  const scheduleSave = useCallback(() => {
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
        hydrateBoardFiles(boardId, missingFileIds, excalidrawApi).catch(
          (err) => {
            console.error("Failed to load board files", err);
          }
        );
      }
    },
    [boardId]
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
        return;
      }

      let fresh;
      try {
        fresh = await getBoardScene(boardId);
      } catch (err) {
        console.error("Failed to refetch board scene", err);
        return;
      }

      const stored = (fresh.elements ?? []) as OrderedExcalidrawElement[];
      queryClient.setQueryData(["boards", boardId, "scene"], fresh);

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
        hydrateBoardFiles(boardId, missingFileIds, excalidrawApi).catch(
          (err) => {
            console.error("Failed to load board files", err);
          }
        );
      }
    },
    [boardId, queryClient, scheduleSave]
  );

  const { broadcastElements } = useCanvasHub(
    boardId,
    onElementsUpdated,
    onSceneSaved,
    realtimeEnabled
  );

  useEffect(() => {
    if (board.data) addRecentBoard(board.data.id);
  }, [board.data]);

  // called on every excalidraw change(text/displacement of element etc.)
  function handleChange(
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) {
    latestSceneRef.current = { elements, appState, files };

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
        performSave("Replace");
      } else {
        broadcastElements(changed);
        scheduleSave();
      }
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
      const snapshot = latestSceneRef.current;
      if (!snapshot || cannotEditRef.current) return;
      const { data, blob, hash } = buildScene(snapshot);
      queryClient.setQueryData(["boards", boardId, "scene"], data);

      const form = new FormData();
      form.append("Scene", blob, "scene.json");
      form.append("SceneHash", String(hash));
      form.append("Kind", "Incremental");

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
    <div className="relative min-h-0 min-w-0 flex-1">
      <BoardOverviewDialog
        boardId={boardId}
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
      />

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

      <ExcalidrawMiscToolPortal>
        <button
          type="button"
          className="ToolIcon__icon transition-colors hover:bg-[var(--island-bg-color)]"
          onClick={() => setOverviewOpen(true)}
          title="Board overview"
          aria-label="Board overview"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--icon-fill-color)",
          }}
        >
          <InfoIcon style={{ width: "1.25rem", height: "1.25rem" }} />
        </button>
      </ExcalidrawMiscToolPortal>

      <Excalidraw
        renderTopRightUI={(isMobile) =>
          isMobile ? null : (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setOverviewOpen(true)}
              title="Board overview"
              className="[&_svg:not([class*='size-'])]:size-5"
            >
              <InfoIcon />
              Overview
            </Button>
          )
        }
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
