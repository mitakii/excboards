import { useState, type ReactNode } from "react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { BoardOverviewDialog } from "./BoardOverviewDialog";

export function SidebarBoardTile({
  id,
  name,
  trailing,
}: {
  id: string;
  name: string;
  /** Icon shown at the right edge of the tile. */
  trailing?: ReactNode;
}) {
  const [overviewOpen, setOverviewOpen] = useState(false);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        variant="outline"
        size="lg"
        onClick={() => setOverviewOpen(true)}
      >
        <span className="truncate">{name}</span>
        {trailing && (
          <span className="ml-auto flex shrink-0 items-center">{trailing}</span>
        )}
      </SidebarMenuButton>
      <BoardOverviewDialog
        boardId={id}
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
      />
    </SidebarMenuItem>
  );
}
