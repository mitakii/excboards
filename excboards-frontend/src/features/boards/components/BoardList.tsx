import { BoardCard, type BoardCardData } from "./BoardCard";

export function BoardList({
  boards,
  emptyMessage,
  onDelete,
}: {
  boards: BoardCardData[];
  emptyMessage: string;
  onDelete?: (id: string) => void;
}) {
  if (boards.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} onDelete={onDelete} />
      ))}
    </div>
  );
}
