import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRecentUsers } from "../queries";

export function RecentUsersList() {
  const users = useRecentUsers();

  if (users.length === 0) {
    return (
      <p className="px-2 py-1 text-xs text-sidebar-foreground/60">
        No recently visited users yet.
      </p>
    );
  }

  return (
    <SidebarMenu>
      {users.map((user) => (
        <SidebarMenuItem key={user.userId}>
          <SidebarMenuButton asChild>
            <Link to={`/${user.username}`}>
              <Avatar size="sm">
                <AvatarFallback>
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{user.username}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
