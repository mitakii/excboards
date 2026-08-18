import { useLocation, useMatch } from "react-router-dom";
import { BoardContextSidebar } from "@/features/boards/components/BoardContextSidebar";
import { cn } from "@/lib/utils";
import { HomeSidebarContent } from "./sidebar/HomeSidebarContent";

const HIDDEN_PATHS = ["/login", "/register"];

export function AppSidebar({ open }: { open: boolean }) {
  const location = useLocation();
  const boardMatch = useMatch("/boards/:id");

  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col gap-6 overflow-y-auto border-border transition-[width] duration-200",
        open ? "w-72 border-r p-4" : "w-0 border-r-0 p-0",
      )}
    >
      {open && (boardMatch ? <BoardContextSidebar boardId={boardMatch.params.id!} /> : <HomeSidebarContent />)}
    </aside>
  );
}
