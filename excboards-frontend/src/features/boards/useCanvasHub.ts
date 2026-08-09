import { useCallback, useEffect, useRef } from "react";
import { HubConnectionState, type HubConnection } from "@microsoft/signalr";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { createCanvasHubConnection } from "@/lib/signalr";

export function useCanvasHub(
  boardId: string | undefined,
  onElementsUpdated: (elements: OrderedExcalidrawElement[]) => void,
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

    connection
      .start()
      .then(() => connection.invoke("JoinRoom", boardId))
      .catch((err) => console.error("Failed to join board room", err));

    return () => {
      connectionRef.current = null;
      connection
        .invoke("LeaveRoom", boardId)
        .catch(() => undefined)
        .finally(() => connection.stop());
    };
  }, [boardId]);

  const broadcastElements = useCallback(
    (elements: OrderedExcalidrawElement[]) => {
      const connection = connectionRef.current;
      if (!boardId || !connection || connection.state !== HubConnectionState.Connected) return;

      connection.invoke("BroadcastElements", boardId, elements).catch((err) => {
        console.error("Failed to broadcast elements", err);
      });
    },
    [boardId],
  );

  return { broadcastElements };
}
