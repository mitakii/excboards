import { HeartIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToggleLike } from "../queries";

/** Heart + count. Anonymous viewers (isLiked === null) see the count but can't like. */
export function LikeButton({
  boardId,
  isLiked,
  likesCount,
  size = "xs",
  className,
}: {
  boardId: string;
  isLiked: boolean | null | undefined;
  likesCount: number;
  size?: "xs" | "sm";
  className?: string;
}) {
  const toggle = useToggleLike();
  const countLabel = `${likesCount} ${likesCount === 1 ? "like" : "likes"}`;

  if (isLiked == null) {
    return (
      <span
        aria-label={countLabel}
        className={cn(
          "inline-flex items-center gap-1 px-2 text-muted-foreground tabular-nums",
          size === "xs" ? "text-xs [&_svg]:size-3" : "text-sm [&_svg]:size-4",
          className
        )}
      >
        <HeartIcon aria-hidden />
        {likesCount}
      </span>
    );
  }

  const label = isLiked ? "Unlike" : "Like";

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      aria-pressed={isLiked}
      aria-label={`${label} (${countLabel})`}
      title={label}
      className={cn(
        "tabular-nums text-muted-foreground hover:text-foreground",
        isLiked && "text-rose-500 hover:text-rose-600",
        className
      )}
      onClick={() =>
        toggle(boardId, !isLiked, (err) =>
          toast.error(getErrorMessage(err, "Couldn't update like."))
        )
      }
    >
      <HeartIcon className={cn(isLiked && "fill-current")} />
      {likesCount}
    </Button>
  );
}
