import { useState } from "react";
import { PagePagination } from "@/components/PagePagination";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { BoardList } from "@/features/boards/components/BoardList";
import type { BoardCardData } from "@/features/boards/components/BoardCard";
import { useLatestBoards } from "@/features/boards/queries";
import { useUsersByIds } from "@/features/profile/queries";

const PAGE_SIZE = 12;

export function LatestBoardsSection() {
  const [page, setPage] = useState(1);
  const boards = useLatestBoards(page, PAGE_SIZE);
  const latest = boards.data?.result ?? [];
  const owners = useUsersByIds(latest.map((board) => board.ownerId));

  const items: BoardCardData[] = latest.map((board) => {
    const owner = owners[board.ownerId];
    return {
      id: board.id,
      name: board.name,
      description: board.description ?? "",
      tags: board.tags.map((tag) => tag.name),
      owner: owner
        ? { username: owner.username, pfpUrl: owner.profilePictureUrl }
        : undefined,
      updatedAt: new Date(board.updated).toLocaleDateString(),
      isPublished: board.isPublished,
      isBookmarked: board.isBookmarked,
      likesCount: board.likesCount,
      isLiked: board.isLiked,
    };
  });

  return (
    <section className="space-y-3">
      {boards.isLoading ? (
        <div className="flex justify-center py-8 text-muted-foreground">
          <Spinner />
        </div>
      ) : boards.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(boards.error, "Failed to load latest boards.")}
        </p>
      ) : (
        <BoardList boards={items} emptyMessage="No boards yet." />
      )}
      {(boards.data?.totalCount ?? 0) > PAGE_SIZE && (
        <PagePagination
          page={page}
          onPageChange={setPage}
          pageSize={PAGE_SIZE}
          total={boards.data?.totalCount ?? 0}
        />
      )}
    </section>
  );
}
