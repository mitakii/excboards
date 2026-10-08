import { useRef } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MAX_BOARD_THUMBNAILS } from "../api";
import { UploadLimitError } from "../uploadLimits";
import {
  useAddBoardThumbnail,
  useBoardThumbnails,
  useDeleteBoardThumbnail,
} from "../queries";

const TILE_CLASS = "aspect-video h-20 shrink-0 rounded-lg";

export function ThumbnailEditor({ boardId }: { boardId: string }) {
  const thumbnails = useBoardThumbnails(boardId);
  const addThumbnail = useAddBoardThumbnail(boardId);
  const deleteThumbnail = useDeleteBoardThumbnail(boardId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const items = thumbnails.data ?? [];
  const canAddMore = items.length < MAX_BOARD_THUMBNAILS;

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) addThumbnail.mutate(file);
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
        {items.map((thumbnail) => (
          <div
            key={thumbnail.position}
            className={cn(
              TILE_CLASS,
              "group relative overflow-hidden border border-border bg-muted"
            )}
          >
            {thumbnail.downloadUrl && (
              <img
                src={thumbnail.downloadUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            <button
              type="button"
              aria-label="Remove thumbnail"
              onClick={() => deleteThumbnail.mutate(thumbnail.position)}
              disabled={
                deleteThumbnail.isPending &&
                deleteThumbnail.variables === thumbnail.position
              }
              className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={addThumbnail.isPending}
            aria-label="Add thumbnail"
            className={cn(
              TILE_CLASS,
              "flex items-center justify-center border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
            )}
          >
            {addThumbnail.isPending ? <Spinner /> : <PlusIcon />}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {addThumbnail.isError && (
        <p className="text-sm text-destructive">
          {addThumbnail.error instanceof UploadLimitError
            ? addThumbnail.error.message
            : getErrorMessage(addThumbnail.error, "Failed to upload thumbnail.")}
        </p>
      )}
    </div>
  );
}
