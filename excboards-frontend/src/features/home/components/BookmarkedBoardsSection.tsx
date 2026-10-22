import { LoadMore } from "@/components/LoadMore";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { flattenCursorPages } from "@/lib/cursorPaging";
import { BoardList } from "@/features/boards/components/BoardList";
import type { BoardCardData } from "@/features/boards/components/BoardCard";
import { useBookmarkedBoards } from "@/features/bookmarks/queries";
import { useUsersByIds } from "@/features/profile/queries";

const PAGE_SIZE = 9;

export function BookmarkedBoardsSection({
  maxPages,
  viewAll,
}: {
  /** Cap "load more" (home page) and link to the full list instead. */
  maxPages?: number;
  viewAll?: { to: string; label: string };
} = {}) {
  const boards = useBookmarkedBoards(PAGE_SIZE);
  const { items: bookmarked, total } = flattenCursorPages(
    boards.data,
    (board) => board.boardId
  );
  const owners = useUsersByIds(bookmarked.map((board) => board.ownerId));

  const items: BoardCardData[] = bookmarked.map((board) => {
    const owner = owners[board.ownerId];
    return {
      id: board.boardId,
      name: board.name,
      description: board.description ?? "",
      tags: board.tags.map((tag) => tag.name),
      owner: owner
        ? { username: owner.username, pfpUrl: owner.profilePictureUrl }
        : undefined,
      updatedAt: new Date(board.updatedAt).toLocaleDateString(),
      isPublished: board.isPublished,
      // set by the bookmark button's cache update; rows start out bookmarked
      isBookmarked: board.isBookmarked ?? true,
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
          {getErrorMessage(boards.error, "Failed to load bookmarked boards.")}
        </p>
      ) : (
        <BoardList
          boards={items}
          emptyMessage="Boards you bookmark will show up here."
        />
      )}
      <LoadMore
        shown={items.length}
        total={total}
        hasMore={!!boards.hasNextPage}
        loading={boards.isFetchingNextPage}
        onLoadMore={() => boards.fetchNextPage()}
        pagesLoaded={boards.data?.pages.length}
        maxPages={maxPages}
        viewAll={viewAll}
      />
    </section>
  );
}
