import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useBoardThumbnails } from "../queries";
import { ThumbnailLightbox } from "./ThumbnailLightbox";
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
  const [expanded, setExpanded] = useState<number | null>(null);

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
        {items.map((thumbnail, i) => (
          // The img itself is the flex item (a wrapping button would break the
          // grow-to-fill sizing), so it takes the button role directly.
          <img
            key={thumbnail.position}
            src={thumbnail.downloadUrl}
            alt={`Thumbnail ${i + 1}`}
            role="button"
            tabIndex={0}
            onClick={() => setExpanded(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpanded(i);
              }
            }}
            onLoad={measure}
            // grow: when the images are narrower than the strip, share the
            // leftover width (cropped via object-cover) instead of showing bg
            className="h-full w-auto shrink-0 grow cursor-zoom-in object-cover outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
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
      <ThumbnailLightbox
        urls={items.map((t) => t.downloadUrl!)}
        index={expanded}
        onIndexChange={setExpanded}
        onClose={() => setExpanded(null)}
      />
    </div>
  );
}
