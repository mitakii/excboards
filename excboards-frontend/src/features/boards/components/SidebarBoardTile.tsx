import { useState } from "react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { BoardOverviewDialog } from "./BoardOverviewDialog";

export function SidebarBoardTile({ id, name }: { id: string; name: string }) {
  const [overviewOpen, setOverviewOpen] = useState(false);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        variant="outline"
        size="lg"
        onClick={() => setOverviewOpen(true)}
      >
        <span className="truncate">{name}</span>
      </SidebarMenuButton>
      <BoardOverviewDialog
        boardId={id}
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
      />
    </SidebarMenuItem>
  );
}
