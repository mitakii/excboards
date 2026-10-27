import { useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useSessionGeneration } from "@/features/auth/queries";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";
import { ScrollToTopButton } from "./ScrollToTopButton";

const NO_SIDEBAR_PATHS = ["/login", "/register"];

export function Layout() {
  const { pathname } = useLocation();
  const showSidebar = !NO_SIDEBAR_PATHS.includes(pathname);
  const sessionGeneration = useSessionGeneration();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <SidebarProvider defaultOpen={false}>
      {showSidebar && <AppSidebar />}
      <SidebarInset className="h-svh min-h-0 overflow-hidden">
        <Navbar showSidebarTrigger={showSidebar} />
        <div
          ref={scrollRef}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
        >
          {/* a crashing page keeps the navbar; navigating elsewhere clears the error */}
          <ErrorBoundary resetKey={pathname}>
            {/* remount the page on login/logout so nothing shows the previous user's data */}
            <Outlet key={sessionGeneration} />
          </ErrorBoundary>
        </div>
        <ScrollToTopButton scrollRef={scrollRef} />
      </SidebarInset>
    </SidebarProvider>
  );
}
