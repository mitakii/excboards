import { BoardList } from "@/features/boards/components/BoardList";
import { getRecentlyViewedBoards } from "@/lib/mockData";

export function RecentlyViewedSection() {
  const boards = getRecentlyViewedBoards();

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Recently viewed</h2>
      <BoardList boards={boards} emptyMessage="You haven't viewed any boards yet." />
    </section>
  );
}
