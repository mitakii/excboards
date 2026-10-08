import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserSearchResult } from "../api";

const cardBase =
  "flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:bg-muted/50 hover:shadow-sm";

export function UserResultCard({
  user,
  onSelect,
}: {
  user: UserSearchResult;
  onSelect?: () => void;
}) {
  return (
    <Link to={`/${user.username}`} onClick={onSelect} className={cardBase}>
      <Avatar size="sm">
        {user.profilePictureUrl && (
          <AvatarImage src={user.profilePictureUrl} alt={user.username} />
        )}
        <AvatarFallback>
          {user.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          @{user.username}
        </p>
        <p className="truncate text-xs text-muted-foreground">User</p>
      </div>
    </Link>
  );
}
