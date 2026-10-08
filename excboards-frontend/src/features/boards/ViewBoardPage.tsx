import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { addRecentBoard } from "@/lib/recentBoards";
import { useStatus } from "@/features/auth/queries";
import { BOARDS_API } from "./api";
import { useBoard, useBoardCollaborators, useBoardScene } from "./queries";
import { BoardCanvas } from "./components/BoardCanvas";
import { BoardOverviewDialog } from "./components/BoardOverviewDialog";
import { ExcalidrawMiscToolPortal } from "./components/ExcalidrawMiscToolPortal";

export function ViewBoardPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  return <ViewBoardCanvas key={id} boardId={id} />;
}

function ViewBoardCanvas({ boardId }: { boardId: string }) {
  const board = useBoard(boardId);
  const scene = useBoardScene(boardId);
  const collaborators = useBoardCollaborators(boardId);
  const { data: user, isLoading: statusLoading } = useStatus();

  const realtimeEnabled = (collaborators.data?.length ?? 0) > 0;

  const [overviewOpen, setOverviewOpen] = useState(false);

  const isOwner = Boolean(
    user &&
      board.data &&
      user.userId.toLowerCase() === board.data.ownerId.toLowerCase()
  );
  const myPermission = (collaborators.data ?? []).find(
    (c) => user && c.userId.toLowerCase() === user.userId.toLowerCase()
  )?.permission;
  // Anonymous visitors and Viewer collaborators can't edit. A failed collaborator
  // lookup leaves non-owners read-only too; the server enforces this either way.
  const cannotEdit =
    !user || (!isOwner && myPermission !== "Editor" && myPermission !== "Admin");

  useEffect(() => {
    if (board.data) addRecentBoard(board.data.id);
  }, [board.data]);

  // wait for login status and collaborators too, so the canvas opens in the right
  // mode instead of flipping between editable and read-only
  if (board.isLoading || scene.isLoading || collaborators.isLoading || statusLoading) {
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
    <BoardCanvas
      boardId={boardId}
      apiBase={BOARDS_API}
      sceneQueryKey={["boards", boardId, "scene"]}
      boardPath={`/boards/${boardId}`}
      sceneData={scene.data}
      cannotEdit={cannotEdit}
      viewModeEnabled={cannotEdit}
      realtimeEnabled={realtimeEnabled}
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
    >
      <BoardOverviewDialog
        boardId={boardId}
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
      />

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
    </BoardCanvas>
  );
}
