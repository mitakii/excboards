import { useState } from "react";
import { GlobeIcon, LockIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ClampText } from "@/components/ClampText";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BookmarkButton } from "@/features/bookmarks/components/BookmarkButton";
import { LikeButton } from "@/features/likes/components/LikeButton";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useBoardThumbnails } from "../queries";
import { BoardOverviewDialog } from "./BoardOverviewDialog";
import { BoardThumbnailCarousel } from "./BoardThumbnailCarousel";

export interface BoardCardData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  owner?: { username: string; pfpUrl?: string };
  updatedAt: string;
  isPublished: boolean;
  /** null for anonymous viewers, which hides the bookmark button. */
  isBookmarked?: boolean | null;
  likesCount: number;
  /** null for anonymous viewers: the count shows but can't be clicked. */
  isLiked?: boolean | null;
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

export function BoardCard({
  board,
  onDelete,
}: {
  board: BoardCardData;
  onDelete?: (id: string) => void | Promise<unknown>;
}) {
  const [overviewOpen, setOverviewOpen] = useState(false);
  const { data: thumbnails } = useBoardThumbnails(board.id);
  const hasThumbnail = (thumbnails?.length ?? 0) > 0;

  const overviewDialog = (
    <BoardOverviewDialog
      boardId={board.id}
      open={overviewOpen}
      onOpenChange={setOverviewOpen}
    />
  );

  return (
    <div className="group relative block">
      {/* Stretched button — clicking the card opens the board overview. */}
      <button
        type="button"
        onClick={() => setOverviewOpen(true)}
        aria-label={`Overview of ${board.name}`}
        className="absolute inset-0 rounded-xl"
      />
      <Card
        size="sm"
        className={cn(
          "pointer-events-none transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-muted/50 group-hover:shadow-md",
          hasThumbnail && "pt-0"
        )}
      >
        <BoardThumbnailCarousel
          boardId={board.id}
          className="w-full rounded-t-xl"
        />
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <VisibilityIcon isPublished={board.isPublished} />
            <span className="truncate">{board.name}</span>
          </CardTitle>
          <CardDescription>
            <ClampText lines={3}>{board.description}</ClampText>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <div className="mt-auto space-y-3">
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
              <div className="pointer-events-auto relative z-10 ml-auto flex items-center">
                <BookmarkButton
                  boardId={board.id}
                  isBookmarked={board.isBookmarked}
                  size="icon-sm"
                />
                <LikeButton
                  boardId={board.id}
                  isLiked={board.isLiked}
                  likesCount={board.likesCount}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {onDelete && (
        <ConfirmDialog
          size="sm"
          icon={<Trash2Icon />}
          title="Delete board?"
          description={
            <>
              <span className="font-medium text-foreground wrap-anywhere">
                {board.name}
              </span>{" "}
              and all its contents will be permanently deleted.
            </>
          }
          confirmLabel="Delete"
          onConfirm={async () => {
            try {
              await onDelete(board.id);
            } catch (err) {
              toast.error(getErrorMessage(err, "Couldn't delete board."));
              throw err;
            }
          }}
          trigger={
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 z-10 bg-background/90 shadow-sm backdrop-blur-sm hover:bg-background"
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
