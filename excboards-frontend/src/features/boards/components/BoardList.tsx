import { cn, staggerDelay } from "@/lib/utils";
import { BoardCard, type BoardCardData } from "./BoardCard";

const ENTRANCE_CLASS =
  "animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-300";

export function BoardList({
  boards,
  emptyMessage,
  onDelete,
}: {
  boards: BoardCardData[];
  emptyMessage: string;
  onDelete?: (id: string) => void | Promise<unknown>;
}) {
  if (boards.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {boards.map((board, index) => (
        <div
          key={board.id}
          className={cn("mb-4 break-inside-avoid", ENTRANCE_CLASS)}
          style={staggerDelay(index)}
        >
          <BoardCard board={board} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
}
