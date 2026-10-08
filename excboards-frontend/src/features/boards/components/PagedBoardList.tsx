import type { UseQueryResult } from "@tanstack/react-query";
import { PagePagination } from "@/components/PagePagination";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage, type PagedEnvelope } from "@/lib/api";
import { useUsersByIds } from "@/features/profile/queries";
import type { Board } from "../api";
import { BoardList } from "./BoardList";
import type { BoardCardData } from "./BoardCard";

/** A paged board query rendered as cards: owner lookup, loading/error states and pagination. */
export function PagedBoardList({
  query,
  page,
  onPageChange,
  pageSize,
  emptyMessage,
  errorMessage = "Failed to load boards.",
  onDelete,
}: {
  query: UseQueryResult<PagedEnvelope<Board>>;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  emptyMessage: string;
  errorMessage?: string;
  onDelete?: (id: string) => void | Promise<unknown>;
}) {
  const boards = query.data?.result ?? [];
  const owners = useUsersByIds(boards.map((board) => board.ownerId));
  const total = query.data?.totalCount ?? 0;

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
        <BoardList boards={items} emptyMessage={emptyMessage} onDelete={onDelete} />
      )}
      {total > pageSize && (
        <PagePagination
          page={page}
          onPageChange={onPageChange}
          pageSize={pageSize}
          total={total}
        />
      )}
    </section>
  );
}
