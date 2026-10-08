import { useState } from "react";
import { cn } from "@/lib/utils";
import { useBoardThumbnails } from "../queries";
import { ThumbnailNavButton } from "./ThumbnailNavButton";

// width:height limits for the image frame: 3:4 (tallest) to 2:1 (widest)
const MIN_RATIO = 3 / 4;
const MAX_RATIO = 2;

export function BoardThumbnailCarousel({
  boardId,
  className,
}: {
  boardId: string;
  className?: string;
}) {
  const { data: thumbnails } = useBoardThumbnails(boardId);
  const [index, setIndex] = useState(0);
  // Set once from the first image that loads, then kept: browsing to differently shaped
  // thumbnails never changes the card height, and nothing below it shifts.
  const [ratio, setRatio] = useState<number | null>(null);

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
    <div
      className={cn("relative overflow-hidden bg-muted", className)}
      // 0px tall until the first image is measured, so the card grows once instead of twice
      style={ratio === null ? undefined : { aspectRatio: ratio }}
    >
      {current.downloadUrl && (
        <img
          src={current.downloadUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onLoad={(e) => {
            if (ratio !== null) return;
            const { naturalWidth, naturalHeight } = e.currentTarget;
            if (!naturalWidth || !naturalHeight) return;
            setRatio(
              Math.min(MAX_RATIO, Math.max(MIN_RATIO, naturalWidth / naturalHeight))
            );
          }}
        />
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
