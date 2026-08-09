import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
