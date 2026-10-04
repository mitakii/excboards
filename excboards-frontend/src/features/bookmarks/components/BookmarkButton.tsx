import { BookmarkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToggleBookmark } from "../queries";

/** Toggles a bookmark; renders nothing for anonymous viewers (isBookmarked === null). */
export function BookmarkButton({
  boardId,
  isBookmarked,
  size = "icon-xs",
  className,
}: {
  boardId: string;
  isBookmarked: boolean | null | undefined;
  size?: "icon-xs" | "icon-sm";
  className?: string;
}) {
  const toggle = useToggleBookmark();

  if (isBookmarked == null) return null;

  const label = isBookmarked ? "Remove bookmark" : "Bookmark";

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      aria-pressed={isBookmarked}
      aria-label={label}
      title={label}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={() =>
        toggle(boardId, !isBookmarked, (err) =>
          toast.error(getErrorMessage(err, "Couldn't update bookmark."))
        )
      }
    >
      <BookmarkIcon className={cn(isBookmarked && "fill-current")} />
    </Button>
  );
}
