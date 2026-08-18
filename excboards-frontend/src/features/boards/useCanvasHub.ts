import { useCallback, useEffect, useRef } from "react";
import { HubConnectionState, type HubConnection } from "@microsoft/signalr";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { createCanvasHubConnection } from "@/lib/signalr";

export function useCanvasHub(
  boardId: string | undefined,
  onElementsUpdated: (elements: OrderedExcalidrawElement[]) => void
) {
  const connectionRef = useRef<HubConnection | null>(null);
  const onElementsUpdatedRef = useRef(onElementsUpdated);
  onElementsUpdatedRef.current = onElementsUpdated;

  useEffect(() => {
    if (!boardId) return;

    const connection = createCanvasHubConnection();
    connectionRef.current = connection;

    connection.on("ElementsUpdated", (elements: OrderedExcalidrawElement[]) => {
      onElementsUpdatedRef.current(elements);
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
  }, [boardId]);

  const broadcastElements = useCallback(
    (elements: OrderedExcalidrawElement[]) => {
      const connection = connectionRef.current;
      if (
        !boardId ||
        !connection ||
        connection.state !== HubConnectionState.Connected
      )
        return;

      connection.invoke("BroadcastElements", boardId, elements).catch((err) => {
        console.error("Failed to broadcast elements", err);
      });
    },
    [boardId]
  );

  return { broadcastElements };
}
