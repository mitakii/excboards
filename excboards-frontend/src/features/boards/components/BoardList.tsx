import { BoardCard, type BoardCardData } from "./BoardCard";

export function BoardList({
  boards,
  emptyMessage,
  onDelete,
  layout = "grid",
}: {
  boards: BoardCardData[];
  emptyMessage: string;
  onDelete?: (id: string) => void;
  layout?: "grid" | "list";
}) {
  if (boards.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  if (layout === "list") {
    return (
      <div className="flex flex-col gap-2">
        {boards.map((board) => (
          <BoardCard key={board.id} board={board} onDelete={onDelete} layout="row" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} onDelete={onDelete} />
      ))}
    </div>
  );
}
