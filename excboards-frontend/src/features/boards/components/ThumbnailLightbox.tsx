import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Full-screen view of one thumbnail over a blurred backdrop; arrows/keys cycle through the rest. */
export function ThumbnailLightbox({
  urls,
  index,
  onIndexChange,
  onClose,
}: {
  urls: string[];
  /** null = closed */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const open = index !== null && urls.length > 0;
  const current = open ? Math.min(index, urls.length - 1) : 0;
  const hasMultiple = urls.length > 1;

  function go(delta: number) {
    onIndexChange((current + delta + urls.length) % urls.length);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onKeyDown={(e) => {
            if (!hasMultiple) return;
            if (e.key === "ArrowLeft") go(-1);
            else if (e.key === "ArrowRight") go(1);
          }}
          // Clicking the empty area around the image closes, like the overlay.
          onClick={(e) => e.target === e.currentTarget && onClose()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none sm:p-12 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <DialogPrimitive.Title className="sr-only">
            {hasMultiple ? `Thumbnail ${current + 1} of ${urls.length}` : "Thumbnail"}
          </DialogPrimitive.Title>

          {open && (
            <img
              src={urls[current]}
              alt=""
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            />
          )}

          <DialogPrimitive.Close asChild>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 rounded-full"
              aria-label="Close"
            >
              <XIcon />
            </Button>
          </DialogPrimitive.Close>

          {hasMultiple && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full"
                aria-label="Previous thumbnail"
                onClick={() => go(-1)}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full"
                aria-label="Next thumbnail"
                onClick={() => go(1)}
              >
                <ChevronRightIcon />
              </Button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white tabular-nums">
                {current + 1} / {urls.length}
              </span>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
