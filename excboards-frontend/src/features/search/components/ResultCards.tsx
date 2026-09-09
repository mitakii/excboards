import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BoardSearchResult, UserSearchResult } from "../api";

const cardBase =
  "flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50";

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

export function BoardResultCard({
  board,
  onSelect,
}: {
  board: BoardSearchResult;
  onSelect?: () => void;
}) {
  return (
    <Link
      to={`/boards/${board.id}`}
      onClick={onSelect}
      className={cn(cardBase, "items-start")}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {board.name}
        </p>
        {board.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {board.description}
          </p>
        )}
        {board.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {board.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-[10px]">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
