import { useState } from "react";
import { Link } from "react-router-dom";
import { InfoIcon, MoreVerticalIcon, Trash2Icon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BoardOverviewDialog } from "./BoardOverviewDialog";

export interface BoardCardData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  owner?: { username: string; pfpUrl?: string };
  updatedAt: string;
}

function BoardRowMenu({
  board,
  onDelete,
}: {
  board: BoardCardData;
  onDelete?: (id: string) => void;
}) {
  const [overviewOpen, setOverviewOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="shrink-0 text-muted-foreground"
            aria-label="Board actions"
          >
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOverviewOpen(true)}>
            <InfoIcon />
            Overview
          </DropdownMenuItem>
          <DropdownMenuLabel className="font-normal">
            Updated {board.updatedAt}
          </DropdownMenuLabel>
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(board.id)}
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <BoardOverviewDialog
        boardId={board.id}
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
      />
    </>
  );
}

export function BoardCard({
  board,
  onDelete,
  layout = "card",
}: {
  board: BoardCardData;
  onDelete?: (id: string) => void;
  layout?: "card" | "row";
}) {
  if (layout === "row") {
    return (
      <div className="relative flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
        <Link to={`/boards/${board.id}`} className="min-w-0 flex-1">
          <span className="block truncate text-base font-medium text-foreground">
            {board.name}
          </span>

          {board.owner && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar size="sm">
                {board.owner.pfpUrl && <AvatarImage src={board.owner.pfpUrl} />}
                <AvatarFallback>
                  {board.owner.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{board.owner.username}</span>
            </div>
          )}

          {board.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {board.description}
            </p>
          )}

          {board.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {board.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </Link>

        <BoardRowMenu board={board} onDelete={onDelete} />
      </div>
    );
  }

  return (
    <Link to={`/boards/${board.id}`} className="relative block">
      <Card size="sm" className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle>{board.name}</CardTitle>
          <CardDescription>{board.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {board.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {board.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {board.owner && (
              <>
                <Avatar size="sm">
                  <AvatarFallback>
                    {board.owner.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{board.owner.username}</span>
                <span aria-hidden>·</span>
              </>
            )}
            <span>Updated {board.updatedAt}</span>
          </div>
        </CardContent>
      </Card>
      {onDelete && (
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-2 right-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(board.id);
          }}
        >
          Delete
        </Button>
      )}
    </Link>
  );
}
