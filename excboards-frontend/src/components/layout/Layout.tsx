import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-svh flex-col">
      <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((open) => !open)} />
      <div className="flex min-h-0 flex-1">
        <AppSidebar open={sidebarOpen} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
