import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Full-height transparent prev/next edge overlaid on a thumbnail, revealed on card hover. */
export function ThumbnailNavButton({
  direction,
  label,
  onClick,
}: {
  direction: "left" | "right";
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  const Icon = direction === "left" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "pointer-events-auto absolute inset-y-0 z-10 flex w-10 items-center text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
        direction === "left" ? "left-0 justify-start pl-1" : "right-0 justify-end pr-1"
      )}
    >
      <Icon className="size-5 drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]" />
    </button>
  );
}
