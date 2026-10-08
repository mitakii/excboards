import { useCallback, useEffect, useRef } from "react";
import { HubConnectionState, type HubConnection } from "@microsoft/signalr";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { createCanvasHubConnection } from "@/lib/signalr";

const BROADCAST_MAX_BYTES = 28_000;
// ~25 Hz — onChange fires every frame while dragging; peers don't need 60 msg/s.
const BROADCAST_INTERVAL_MS = 40;
const encoder = new TextEncoder();

function sendElements(
  connection: HubConnection | null,
  boardId: string,
  elements: OrderedExcalidrawElement[]
) {
  if (
    elements.length === 0 ||
    !connection ||
    connection.state !== HubConnectionState.Connected
  )
    return;

  // Oversized frame would kill the connection — skip it. The caller's
  // debounced scene save + the SceneSaved signal bring peers back in sync.
  if (encoder.encode(JSON.stringify(elements)).length > BROADCAST_MAX_BYTES) {
    console.warn("Skipping oversized element broadcast");
    return;
  }

  connection.invoke("BroadcastElements", boardId, elements).catch((err) => {
    console.error("Failed to broadcast elements", err);
  });
}

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
  // Changes waiting for the next throttle tick, keyed by element id so only
  // the latest version of each element is sent.
  const pendingRef = useRef(new Map<string, OrderedExcalidrawElement>());
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const takePending = () => {
    const elements = [...pendingRef.current.values()];
    pendingRef.current.clear();
    return elements;
  };

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

    // Automatic reconnect gets a new connection id, and group membership was
    // tied to the old one — rejoin or we silently stop receiving updates.
    connection.onreconnected(() => {
      if (cancelled) return;
      connection.invoke("JoinRoom", boardId).catch((err) => {
        console.error("Failed to rejoin board room", err);
      });
    });

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
      // Flush the trailing batch so peers see where the element ended up.
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      sendElements(connection, boardId, takePending());
      connectionRef.current = null;
      startPromise.finally(() => {
        connection
          .invoke("LeaveRoom", boardId)
          .catch(() => undefined)
          .finally(() => connection.stop());
      });
    };
  }, [boardId, enabled]);

  // Throttled: the first change goes out immediately, then at most one batch
  // per BROADCAST_INTERVAL_MS until changes stop.
  const broadcastElements = useCallback(
    (elements: OrderedExcalidrawElement[]) => {
      if (!boardId) return;

      for (const el of elements) pendingRef.current.set(el.id, el);
      if (throttleTimerRef.current) return;

      sendElements(connectionRef.current, boardId, takePending());

      const tick = () => {
        if (pendingRef.current.size === 0) {
          throttleTimerRef.current = null;
          return;
        }
        sendElements(connectionRef.current, boardId, takePending());
        throttleTimerRef.current = setTimeout(tick, BROADCAST_INTERVAL_MS);
      };
      throttleTimerRef.current = setTimeout(tick, BROADCAST_INTERVAL_MS);
    },
    [boardId]
  );

  return { broadcastElements };
}
