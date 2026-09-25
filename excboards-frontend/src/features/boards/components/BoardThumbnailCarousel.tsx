import { useState } from "react";
import { cn } from "@/lib/utils";
import { useBoardThumbnails } from "../queries";
import { ThumbnailNavButton } from "./ThumbnailNavButton";

export function BoardThumbnailCarousel({
  boardId,
  className,
}: {
  boardId: string;
  className?: string;
}) {
  const { data: thumbnails } = useBoardThumbnails(boardId);
  const [index, setIndex] = useState(0);

  const items = thumbnails ?? [];
  if (items.length === 0) return null;

  const current = items[Math.min(index, items.length - 1)];
  const hasMultiple = items.length > 1;

  function go(delta: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + items.length) % items.length);
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {current.downloadUrl && (
        <img src={current.downloadUrl} alt="" className="block h-auto w-full" />
      )}
      {hasMultiple && (
        <>
          <ThumbnailNavButton
            direction="left"
            label="Previous thumbnail"
            onClick={(e) => go(-1, e)}
          />
          <ThumbnailNavButton
            direction="right"
            label="Next thumbnail"
            onClick={(e) => go(1, e)}
          />
        </>
      )}
    </div>
  );
}
