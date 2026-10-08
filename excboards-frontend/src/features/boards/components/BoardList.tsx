import { useColumnCount } from "@/hooks/use-column-count";
import { staggerDelay } from "@/lib/utils";
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
  const columnCount = useColumnCount();

  if (boards.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  // Masonry with fixed placement: board i always sits in column i % n, so cards never
  // hop between columns when images load (CSS columns rebalance on every height change).
  const columns = Array.from({ length: columnCount }, (_, column) =>
    boards
      .map((board, index) => ({ board, index }))
      .filter(({ index }) => index % columnCount === column)
  );

  return (
    <div className="flex items-start gap-4">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-4">
          {column.map(({ board, index }) => (
            <div
              key={board.id}
              className={ENTRANCE_CLASS}
              style={staggerDelay(index)}
            >
              <BoardCard board={board} onDelete={onDelete} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
