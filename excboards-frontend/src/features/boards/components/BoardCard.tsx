import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GlobeIcon,
  InfoIcon,
  LockIcon,
  MoreVerticalIcon,
  Trash2Icon,
} from "lucide-react";
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
import { ClampText } from "@/components/ClampText";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BoardOverviewDialog } from "./BoardOverviewDialog";

export interface BoardCardData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  owner?: { username: string; pfpUrl?: string };
  updatedAt: string;
  isPublished: boolean;
}

function VisibilityIcon({ isPublished }: { isPublished: boolean }) {
  const Icon = isPublished ? GlobeIcon : LockIcon;
  return (
    <Icon
      aria-label={isPublished ? "Public board" : "Private board"}
      className="size-3.5 shrink-0 text-muted-foreground"
    />
  );
}

function BoardRowMenu({
  board,
  onDelete,
  onOpenOverview,
}: {
  board: BoardCardData;
  onDelete?: (id: string) => void;
  onOpenOverview: () => void;
}) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
          <DropdownMenuItem onSelect={onOpenOverview}>
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
                onSelect={() => setConfirmDeleteOpen(true)}
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {onDelete && (
        <ConfirmDialog
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          title="Delete board?"
          description={`"${board.name}" and its contents will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={() => onDelete(board.id)}
        />
      )}
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
  const [overviewOpen, setOverviewOpen] = useState(false);

  const overviewDialog = (
    <BoardOverviewDialog
      boardId={board.id}
      open={overviewOpen}
      onOpenChange={setOverviewOpen}
    />
  );

  if (layout === "row") {
    return (
      <div className="relative flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
        {/* Stretched button — clicking anywhere on the card opens the board
            overview, except the nested owner link / actions menu (z-10 above). */}
        <button
          type="button"
          onClick={() => setOverviewOpen(true)}
          aria-label={`Overview of ${board.name}`}
          className="absolute inset-0 rounded-xl"
        />

        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <VisibilityIcon isPublished={board.isPublished} />
            <span className="truncate text-base font-medium text-foreground">
              {board.name}
            </span>
          </span>

          {board.owner && (
            <Link
              to={`/${board.owner.username}`}
              className="relative z-10 mt-2 flex w-fit items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Avatar size="sm">
                {board.owner.pfpUrl && <AvatarImage src={board.owner.pfpUrl} />}
                <AvatarFallback>
                  {board.owner.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate hover:underline">
                {board.owner.username}
              </span>
            </Link>
          )}

          {board.description && (
            <ClampText
              lines={3}
              className="mt-2 text-sm text-muted-foreground"
            >
              {board.description}
            </ClampText>
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
        </div>

        <div className="relative z-10 shrink-0">
          <BoardRowMenu
            board={board}
            onDelete={onDelete}
            onOpenOverview={() => setOverviewOpen(true)}
          />
        </div>
        {overviewDialog}
      </div>
    );
  }

  return (
    <div className="group relative block h-full">
      {/* Stretched button — clicking the card opens the board overview. */}
      <button
        type="button"
        onClick={() => setOverviewOpen(true)}
        aria-label={`Overview of ${board.name}`}
        className="absolute inset-0 rounded-xl"
      />
      <Card
        size="sm"
        className="h-full transition-colors group-hover:bg-muted/50"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <VisibilityIcon isPublished={board.isPublished} />
            <span className="truncate">{board.name}</span>
          </CardTitle>
          <CardDescription>
            <ClampText lines={3}>{board.description}</ClampText>
          </CardDescription>
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
        <ConfirmDialog
          title="Delete board?"
          description={`"${board.name}" and its contents will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={() => onDelete(board.id)}
          trigger={
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 z-10"
            >
              Delete
            </Button>
          }
        />
      )}
      {overviewDialog}
    </div>
  );
}
