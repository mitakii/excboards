import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useBoardThumbnails } from "../queries";
import { ThumbnailNavButton } from "./ThumbnailNavButton";

export function BoardThumbnailStrip({
  boardId,
  className,
}: {
  boardId: string;
  className?: string;
}) {
  const { data: thumbnails } = useBoardThumbnails(boardId);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);

  const items = (thumbnails ?? []).filter((t) => t.downloadUrl);

  function measure() {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const max = Math.max(0, track.scrollWidth - viewport.clientWidth);
    setMaxOffset(max);
    setOffset((prev) => Math.min(prev, max));
  }

  useLayoutEffect(() => {
    measure();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [items.length]);

  if (items.length === 0) return null;

  function page(delta: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const step = (viewportRef.current?.clientWidth ?? 0) * 0.9;
    setOffset((prev) => Math.min(Math.max(prev + delta * step, 0), maxOffset));
  }

  return (
    <div
      ref={viewportRef}
      className={cn("relative overflow-hidden bg-muted", className)}
    >
      <div
        ref={trackRef}
        className={
          "flex h-full gap-1 transition-transform duration-300 ease-out"
        }
        style={{ transform: `translateX(-${offset}px)` }}
      >
        {items.map((thumbnail) => (
          <img
            key={thumbnail.position}
            src={thumbnail.downloadUrl}
            alt=""
            onLoad={measure}
            className="h-full w-auto shrink-0 object-contain"
          />
        ))}
      </div>
      {offset > 0 && (
        <ThumbnailNavButton
          direction="left"
          label="Scroll thumbnails left"
          onClick={(e) => page(-1, e)}
        />
      )}
      {offset < maxOffset && (
        <ThumbnailNavButton
          direction="right"
          label="Scroll thumbnails right"
          onClick={(e) => page(1, e)}
        />
      )}
    </div>
  );
}
