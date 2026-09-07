import { useCallback, useEffect, useRef } from "react";
import { HubConnectionState, type HubConnection } from "@microsoft/signalr";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { createCanvasHubConnection } from "@/lib/signalr";

const BROADCAST_MAX_BYTES = 28_000;
const encoder = new TextEncoder();

export function useCanvasHub(
  boardId: string | undefined,
  onElementsUpdated: (elements: OrderedExcalidrawElement[]) => void,
  onSceneSaved: (sceneHash: number, kind: string) => void,
  enabled = true
) {
  const connectionRef = useRef<HubConnection | null>(null);
  const onElementsUpdatedRef = useRef(onElementsUpdated);
  onElementsUpdatedRef.current = onElementsUpdated;
  const onSceneSavedRef = useRef(onSceneSaved);
  onSceneSavedRef.current = onSceneSaved;

  useEffect(() => {
    if (!boardId || !enabled) return;

    const connection = createCanvasHubConnection();
    connectionRef.current = connection;

    connection.on("ElementsUpdated", (elements: OrderedExcalidrawElement[]) => {
      onElementsUpdatedRef.current(elements);
    });

    // A collaborator persisted the whole scene (e.g. loaded a file) — the socket
    // just carries the hash; the receiver refetches the scene from storage.
    connection.on("SceneSaved", (sceneHash: number, kind: string) => {
      onSceneSavedRef.current(sceneHash, kind);
    });

    let cancelled = false;
    const startPromise = connection
      .start()
      .then(() => {
        if (cancelled) return;
        return connection.invoke("JoinRoom", boardId);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to join board room", err);
      });

    return () => {
      cancelled = true;
      connectionRef.current = null;
      startPromise.finally(() => {
        connection
          .invoke("LeaveRoom", boardId)
          .catch(() => undefined)
          .finally(() => connection.stop());
      });
    };
  }, [boardId, enabled]);

  const broadcastElements = useCallback(
    (elements: OrderedExcalidrawElement[]) => {
      const connection = connectionRef.current;
      if (
        !boardId ||
        !connection ||
        connection.state !== HubConnectionState.Connected
      )
        return;

      // Oversized frame would kill the connection — skip it. The caller's
      // debounced scene save + the SceneSaved signal bring peers back in sync.
      if (
        encoder.encode(JSON.stringify(elements)).length > BROADCAST_MAX_BYTES
      ) {
        console.warn("Skipping oversized element broadcast");
        return;
      }

      connection.invoke("BroadcastElements", boardId, elements).catch((err) => {
        console.error("Failed to broadcast elements", err);
      });
    },
    [boardId]
  );

  return { broadcastElements };
}
