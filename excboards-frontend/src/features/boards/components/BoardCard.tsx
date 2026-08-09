import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export interface BoardCardData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  owner: { username: string; pfpUrl?: string };
  updatedAt: string;
}

export function BoardCard({
  board,
  onDelete,
}: {
  board: BoardCardData;
  onDelete?: (id: string) => void;
}) {
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
            <Avatar size="sm">
              <AvatarFallback>{board.owner.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{board.owner.username}</span>
            <span aria-hidden>·</span>
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
