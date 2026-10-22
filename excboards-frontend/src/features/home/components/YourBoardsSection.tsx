import { PenSquareIcon } from "lucide-react";
import { LoadMore } from "@/components/LoadMore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BoardFormDialog } from "@/features/boards/components/BoardFormDialog";
import { BoardList } from "@/features/boards/components/BoardList";
import type { BoardCardData } from "@/features/boards/components/BoardCard";
import { useUserBoards } from "@/features/boards/queries";
import { useUserById } from "@/features/profile/queries";
import type { AuthUser } from "@/features/auth/api";
import { flattenCursorPages } from "@/lib/cursorPaging";

const PAGE_SIZE = 6;
// The home page stays short: after this many loads, link to the profile's full list.
const MAX_PAGES = 3;

export function YourBoardsSection({ user }: { user: AuthUser }) {
  const boards = useUserBoards(user.userId, PAGE_SIZE);
  const { items: owned, total } = flattenCursorPages(boards.data, (board) => board.id);
  // auth status has no profile picture, so look the user up like the other lists do
  const profile = useUserById(user.userId);

  const username = profile.data?.username ?? user.userName;

  const items: BoardCardData[] = owned.map((board) => ({
    id: board.id,
    name: board.name,
    description: board.description ?? "",
    tags: board.tags.map((tag) => tag.name),
    owner: {
      username,
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
        />
      )}
      <LoadMore
        shown={items.length}
        total={total}
        hasMore={!!boards.hasNextPage}
        loading={boards.isFetchingNextPage}
        onLoadMore={() => boards.fetchNextPage()}
        pagesLoaded={boards.data?.pages.length}
        maxPages={MAX_PAGES}
        viewAll={{ to: `/${username}`, label: "View all on your profile" }}
      />
    </section>
  );
}
