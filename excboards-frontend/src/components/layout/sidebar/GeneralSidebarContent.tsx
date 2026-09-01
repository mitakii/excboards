import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { useStatus } from "@/features/auth/queries";
import { useRecentBoards, useUserBoards } from "@/features/boards/queries";
import { SidebarBoardTile } from "@/features/boards/components/SidebarBoardTile";
import { RecentUsersList } from "@/features/profile/components/RecentUsersList";

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 py-1 text-xs text-sidebar-foreground/60">{children}</p>
  );
}

export function GeneralSidebarContent() {
  const { data: user } = useStatus();
  const recentBoards = useRecentBoards();
  const myBoards = useUserBoards(user?.userId, 1, 20);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Recently visited</SidebarGroupLabel>
        <SidebarGroupContent>
          <RecentUsersList />
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Excalidraw boards</SidebarGroupLabel>
        <SidebarGroupContent>
          {recentBoards.length === 0 ? (
            <EmptyHint>No recently opened boards yet.</EmptyHint>
          ) : (
            <SidebarMenu>
              {recentBoards.map((board) => (
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

      {user && (
        <SidebarGroup>
          <SidebarGroupLabel>Your boards</SidebarGroupLabel>
          <SidebarGroupContent>
            {(myBoards.data ?? []).length === 0 ? (
              <EmptyHint>You haven't created any boards yet.</EmptyHint>
            ) : (
              <SidebarMenu>
                {(myBoards.data ?? []).map((board) => (
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
