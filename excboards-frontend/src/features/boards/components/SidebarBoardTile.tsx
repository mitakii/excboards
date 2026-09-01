import { useState } from "react";
import { Link } from "react-router-dom";
import { InfoIcon } from "lucide-react";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BoardOverviewDialog } from "./BoardOverviewDialog";

export function SidebarBoardTile({ id, name }: { id: string; name: string }) {
  const [overviewOpen, setOverviewOpen] = useState(false);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link to={`/boards/${id}`}>
          <span className="truncate">{name}</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuAction
        showOnHover
        onClick={() => setOverviewOpen(true)}
        aria-label={`Overview of ${name}`}
      >
        <InfoIcon />
      </SidebarMenuAction>
      <BoardOverviewDialog
        boardId={id}
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
      />
    </SidebarMenuItem>
  );
}
