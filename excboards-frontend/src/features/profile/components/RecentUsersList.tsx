import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRecentUsers } from "../queries";

export function RecentUsersList() {
  const users = useRecentUsers();

  if (users.length === 0) {
    return <p className="text-xs text-muted-foreground">No recently visited users yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {users.map((user) => (
        <li key={user.id}>
          <Link
            to={`/${user.username}`}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted"
          >
            <Avatar size="sm">
              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="truncate">{user.username}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
