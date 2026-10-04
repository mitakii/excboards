import { BookmarkIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { useStatus } from "@/features/auth/queries";
import { useUserBoards } from "@/features/boards/queries";
import { useBookmarkedBoards } from "@/features/bookmarks/queries";
import { SidebarBoardTile } from "@/features/boards/components/SidebarBoardTile";
import { RecentUsersList } from "@/features/profile/components/RecentUsersList";

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 py-1 text-xs text-sidebar-foreground/60">{children}</p>
  );
}

export function GeneralSidebarContent() {
  const { data: user } = useStatus();
  const myBoards = useUserBoards(user?.userId, 1, 20);
  const bookmarks = useBookmarkedBoards(1, 20, !!user);
  const bookmarkedBoards = bookmarks.data?.result ?? [];

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Recently visited</SidebarGroupLabel>
        <SidebarGroupContent>
          <RecentUsersList />
        </SidebarGroupContent>
      </SidebarGroup>

      {user && (
        <SidebarGroup>
          <SidebarGroupLabel>Bookmarked boards</SidebarGroupLabel>
          <SidebarGroupContent>
            {bookmarkedBoards.length === 0 ? (
              <EmptyHint>You haven't bookmarked any boards yet.</EmptyHint>
            ) : (
              <SidebarMenu className="gap-1">
                {bookmarkedBoards.map((board) => (
                  <SidebarBoardTile
                    key={board.boardId}
                    id={board.boardId}
                    name={board.name}
                    trailing={
                      <BookmarkIcon
                        aria-label="Bookmarked"
                        className="size-4 fill-current text-sidebar-foreground/70"
                      />
                    }
                  />
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {user && (
        <SidebarGroup>
          <SidebarGroupLabel>Your boards</SidebarGroupLabel>
          <SidebarGroupContent>
            {(myBoards.data?.result ?? []).length === 0 ? (
              <EmptyHint>You haven't created any boards yet.</EmptyHint>
            ) : (
              <SidebarMenu className="gap-1">
                {(myBoards.data?.result ?? []).map((board) => (
                  <SidebarBoardTile
                    key={board.id}
                    id={board.id}
                    name={board.name}
                  />
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
