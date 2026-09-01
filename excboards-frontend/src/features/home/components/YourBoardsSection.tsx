import { useState } from "react";
import { PagePagination } from "@/components/PagePagination";
import { BoardList } from "@/features/boards/components/BoardList";
import type { BoardCardData } from "@/features/boards/components/BoardCard";
import { useUserBoards, useDeleteBoard } from "@/features/boards/queries";
import type { AuthUser } from "@/features/auth/api";

const PAGE_SIZE = 6;

export function YourBoardsSection({ user }: { user: AuthUser }) {
  const [page, setPage] = useState(1);
  const boards = useUserBoards(user.userId, page, PAGE_SIZE);
  const deleteBoard = useDeleteBoard();

  const items: BoardCardData[] = (boards.data ?? []).map((board) => ({
    id: board.id,
    name: board.name,
    description: board.description ?? "",
    tags: board.tags.map((tag) => tag.name),
    owner: { username: user.userName },
    updatedAt: new Date(board.updated).toLocaleDateString(),
  }));

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Your boards</h2>
      <BoardList
        boards={items}
        layout="list"
        emptyMessage="You haven't created any boards yet."
        onDelete={(id) => deleteBoard.mutate(id)}
      />
      {items.length >= PAGE_SIZE && (
        <PagePagination page={page} onPageChange={setPage} pageLength={items.length} pageSize={PAGE_SIZE} />
      )}
    </section>
  );
}
