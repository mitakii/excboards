import { Link, useLocation, useParams } from "react-router-dom";
import { ArchiveIcon, LogInIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { useStatus } from "@/features/auth/queries";
import { BoardCanvas } from "@/features/boards/components/BoardCanvas";
import { formatWorldBoardMonth, WORLD_BOARD_API, type WorldBoard } from "./api";
import {
  useCurrentWorldBoard,
  useWorldBoard,
  useWorldBoardScene,
} from "./queries";

/** `/world` opens the current month's board, `/world/:id` a specific one. */
export function WorldBoardPage() {
  const { id } = useParams<{ id: string }>();
  const current = useCurrentWorldBoard(!id);
  const byId = useWorldBoard(id);
  const board = id ? byId : current;

  if (board.isLoading) return <CenteredSpinner />;

  if (board.isError || !board.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-destructive">
        {getErrorMessage(board.error, "Failed to load the world board.")}
      </div>
    );
  }

  return <WorldBoardCanvas key={board.data.id} board={board.data} />;
}

function CenteredSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center text-muted-foreground">
      <Spinner />
    </div>
  );
}

function WorldBoardCanvas({ board }: { board: WorldBoard }) {
  const scene = useWorldBoardScene(board.id);
  const { data: user, isLoading: userLoading } = useStatus();
  const location = useLocation();

  if (scene.isLoading || userLoading) return <CenteredSpinner />;

  if (scene.isError || !scene.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-destructive">
        {getErrorMessage(scene.error, "Failed to load the world board.")}
      </div>
    );
  }

  // Archived boards are frozen for everyone; the live one needs an account to edit.
  const viewOnly = board.isReadOnly || !user;
  const month = formatWorldBoardMonth(board.createdAt);

  return (
    <BoardCanvas
      boardId={board.id}
      apiBase={WORLD_BOARD_API}
      sceneQueryKey={["worldBoards", board.id, "scene"]}
      boardPath={`/world/${board.id}`}
      sceneData={scene.data}
      cannotEdit={viewOnly}
      realtimeEnabled={!board.isReadOnly}
      viewModeEnabled={viewOnly}
      // A shared board: one "Open" would replace everyone's drawings.
      allowOpenFile={false}
      renderTopRightUI={(isMobile) => (
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Badge variant="outline" className="h-9 px-3 text-sm">
              {board.isReadOnly && <ArchiveIcon />}
              {board.isReadOnly ? `${month} · read-only` : `World Board · ${month}`}
            </Badge>
          )}
          {board.isReadOnly ? (
            <Button asChild variant="outline" size="lg">
              <Link to="/world">Current board</Link>
            </Button>
          ) : (
            !user && (
              <Button asChild size="lg">
                <Link to="/login" state={{ from: location }}>
                  <LogInIcon />
                  Sign in to edit
                </Link>
              </Button>
            )
          )}
        </div>
      )}
    />
  );
}
