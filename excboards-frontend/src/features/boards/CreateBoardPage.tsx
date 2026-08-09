import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import { getErrorMessage } from "@/lib/api";
import { useCreateBoard } from "./queries";
import { BoardSidebar } from "./components/BoardSidebar";

export function CreateBoardPage() {
  const navigate = useNavigate();
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const createBoard = useCreateBoard();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const excalidrawApi = excalidrawApiRef.current;
    if (!excalidrawApi || !name.trim()) return;

    setError(null);
    try {
      const elements = excalidrawApi.getSceneElements();
      const appState = excalidrawApi.getAppState();
      const files = excalidrawApi.getFiles();
      const sceneJson = serializeAsJSON(elements, appState, files, "database");
      const sceneBlob = new Blob([sceneJson], { type: "application/json" });

      const boardId = await createBoard.mutateAsync({ name, description, scene: sceneBlob });
      navigate(`/boards/${boardId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create board."));
    }
  }

  return (
    <div className="flex h-svh">
      <BoardSidebar
        name={name}
        description={description}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onSave={handleSave}
        saving={createBoard.isPending}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {error && <p className="p-2 text-sm text-destructive">{error}</p>}
        <div className="min-h-0 flex-1">
          <Excalidraw excalidrawAPI={(excalidrawApi) => (excalidrawApiRef.current = excalidrawApi)} />
        </div>
      </div>
    </div>
  );
}
