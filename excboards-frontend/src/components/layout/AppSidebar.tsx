import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent, useSidebar } from "@/components/ui/sidebar";
import { GeneralSidebarContent } from "./sidebar/GeneralSidebarContent";

export function AppSidebar() {
  const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();
  const { pathname } = useLocation();

  const sidebarOpen = isMobile ? openMobile : open;
  const setSidebarOpen = isMobile ? setOpenMobile : setOpen;

  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setSidebarOpen(false);
    }
  });

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent
        side="left"
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        overlayClassName="bg-transparent supports-backdrop-filter:backdrop-blur-none"
        className="w-72 max-w-[85vw] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:max-w-none"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Sidebar</SheetTitle>
          <SheetDescription>Recent boards and people.</SheetDescription>
        </SheetHeader>
        <SidebarContent className="p-2">
          <GeneralSidebarContent />
        </SidebarContent>
      </SheetContent>
    </Sheet>
  );
}
