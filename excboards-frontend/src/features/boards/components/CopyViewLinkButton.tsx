import { LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildViewLink, type BoardView } from "../viewLink";
import { ExcalidrawMiscToolPortal } from "./ExcalidrawMiscToolPortal";

interface CopyViewLinkProps {
  /** Canonical board path the link points to, e.g. `/boards/{id}`. */
  path: string;
  getView: () => BoardView | null;
}

async function copyViewLink({ path, getView }: CopyViewLinkProps) {
  const view = getView();
  if (!view) return;
  try {
    await navigator.clipboard.writeText(buildViewLink(path, view));
    toast.success("Link to this view copied");
  } catch {
    toast.error("Couldn't copy the link.");
  }
}

export function CopyViewLinkButton(props: CopyViewLinkProps) {
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => copyViewLink(props)}
      title="Copy link to this view"
      className="[&_svg:not([class*='size-'])]:size-5"
    >
      <LinkIcon />
      Copy link
    </Button>
  );
}

/** Same action in Excalidraw's mobile toolbar, where the top-right UI is hidden. */
export function CopyViewLinkToolButton(props: CopyViewLinkProps) {
  return (
    <ExcalidrawMiscToolPortal>
      <button
        type="button"
        className="ToolIcon__icon transition-colors hover:bg-[var(--island-bg-color)]"
        onClick={() => copyViewLink(props)}
        title="Copy link to this view"
        aria-label="Copy link to this view"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--icon-fill-color)",
        }}
      >
        <LinkIcon style={{ width: "1.25rem", height: "1.25rem" }} />
      </button>
    </ExcalidrawMiscToolPortal>
  );
}
