import { BoardList } from "@/features/boards/components/BoardList";
import type { BoardCardData } from "@/features/boards/components/BoardCard";
import { useRecentBoards } from "@/features/boards/queries";

export function RecentlyViewedSection() {
  const recentBoards = useRecentBoards();

  const items: BoardCardData[] = recentBoards.map((board) => ({
    id: board.id,
    name: board.name,
    description: board.description ?? "",
    tags: board.tags.map((tag) => tag.name),
    updatedAt: new Date(board.updated).toLocaleDateString(),
  }));

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Recently viewed</h2>
      <BoardList boards={items} layout="list" emptyMessage="You haven't viewed any boards yet." />
    </section>
  );
}
