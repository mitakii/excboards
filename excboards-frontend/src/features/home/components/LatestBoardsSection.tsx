import { LoadMore } from "@/components/LoadMore";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { flattenCursorPages } from "@/lib/cursorPaging";
import { BoardList } from "@/features/boards/components/BoardList";
import type { BoardCardData } from "@/features/boards/components/BoardCard";
import { useLatestBoards } from "@/features/boards/queries";
import { useUsersByIds } from "@/features/profile/queries";

const PAGE_SIZE = 12;

export function LatestBoardsSection() {
  const boards = useLatestBoards(PAGE_SIZE);
  const { items: latest, total } = flattenCursorPages(boards.data, (board) => board.id);
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
      <LoadMore
        shown={items.length}
        total={total}
        hasMore={!!boards.hasNextPage}
        loading={boards.isFetchingNextPage}
        onLoadMore={() => boards.fetchNextPage()}
        pagesLoaded={boards.data?.pages.length}
      />
    </section>
  );
}
