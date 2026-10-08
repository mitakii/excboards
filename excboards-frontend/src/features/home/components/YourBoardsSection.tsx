import { useState } from "react";
import { PenSquareIcon } from "lucide-react";
import { PagePagination } from "@/components/PagePagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BoardFormDialog } from "@/features/boards/components/BoardFormDialog";
import { BoardList } from "@/features/boards/components/BoardList";
import type { BoardCardData } from "@/features/boards/components/BoardCard";
import { useUserBoards, useDeleteBoard } from "@/features/boards/queries";
import { useUserById } from "@/features/profile/queries";
import type { AuthUser } from "@/features/auth/api";

const PAGE_SIZE = 6;

export function YourBoardsSection({ user }: { user: AuthUser }) {
  const [page, setPage] = useState(1);
  const boards = useUserBoards(user.userId, page, PAGE_SIZE);
  const deleteBoard = useDeleteBoard();
  // auth status has no profile picture, so look the user up like the other lists do
  const profile = useUserById(user.userId);

  const items: BoardCardData[] = (boards.data?.result ?? []).map((board) => ({
    id: board.id,
    name: board.name,
    description: board.description ?? "",
    tags: board.tags.map((tag) => tag.name),
    owner: {
      username: profile.data?.username ?? user.userName,
      pfpUrl: profile.data?.profilePictureUrl,
    },
    updatedAt: new Date(board.updated).toLocaleDateString(),
    isPublished: board.isPublished,
    isBookmarked: board.isBookmarked,
    likesCount: board.likesCount,
    isLiked: board.isLiked,
  }));

  const isEmpty = boards.isSuccess && items.length === 0;

  return (
    <section className="space-y-3">
      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="rounded-full bg-muted p-3">
              <PenSquareIcon className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                You haven&apos;t created any boards yet
              </p>
              <p className="text-sm text-muted-foreground">
                Start a canvas to sketch, diagram, or plan with your team.
              </p>
            </div>
            <BoardFormDialog
              trigger={
                <Button size="sm">
                  <PenSquareIcon />
                  Create your first board
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <BoardList
          boards={items}
          emptyMessage="You haven't created any boards yet."
          onDelete={(id) => deleteBoard.mutateAsync(id)}
        />
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
