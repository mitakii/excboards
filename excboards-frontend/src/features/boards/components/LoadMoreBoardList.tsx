import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { LoadMore } from "@/components/LoadMore";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage, type CursorEnvelope } from "@/lib/api";
import { flattenCursorPages } from "@/lib/cursorPaging";
import { useUsersByIds } from "@/features/profile/queries";
import type { Board } from "../api";
import { BoardList } from "./BoardList";
import type { BoardCardData } from "./BoardCard";

export function LoadMoreBoardList({
  query,
  emptyMessage,
  errorMessage = "Failed to load boards.",
}: {
  query: UseInfiniteQueryResult<InfiniteData<CursorEnvelope<Board>>>;
  emptyMessage: string;
  errorMessage?: string;
}) {
  const { items: boards, total } = flattenCursorPages(
    query.data,
    (board) => board.id
  );
  const owners = useUsersByIds(boards.map((board) => board.ownerId));

  const items: BoardCardData[] = boards.map((board) => {
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
      {query.isLoading ? (
        <div className="flex justify-center py-8 text-muted-foreground">
          <Spinner />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, errorMessage)}
        </p>
      ) : (
        <BoardList boards={items} emptyMessage={emptyMessage} />
      )}
      <LoadMore
        shown={items.length}
        total={total}
        hasMore={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onLoadMore={() => query.fetchNextPage()}
        pagesLoaded={query.data?.pages.length}
      />
    </section>
  );
}
