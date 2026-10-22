import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface LoadMoreProps {
  /** Items currently rendered. */
  shown: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  /** Stop offering "Load more" after this many pages and link to the full list instead. */
  maxPages?: number;
  pagesLoaded?: number;
  viewAll?: { to: string; label: string };
}

export function LoadMore({
  shown,
  total,
  hasMore,
  loading,
  onLoadMore,
  maxPages,
  pagesLoaded = 0,
  viewAll,
}: LoadMoreProps) {
  const footerRef = useRef<HTMLDivElement>(null);
  const focusFromRef = useRef<number | null>(null);

  useEffect(() => {
    const from = focusFromRef.current;
    if (from === null || shown <= from) return;
    focusFromRef.current = null;
    const scope = footerRef.current?.parentElement;
    const item = scope?.querySelector<HTMLElement>(
      `[data-list-index="${from}"]`
    );
    item
      ?.querySelector<HTMLElement>("a[href], button:not([disabled])")
      ?.focus({ preventScroll: false });
  }, [shown]);

  const capped = maxPages !== undefined && pagesLoaded >= maxPages;

  // Always mounted (even when empty) so the focus effect still has a scope after the last page.
  if (!hasMore) {
    return (
      <div ref={footerRef}>
        {pagesLoaded > 1 && (
          <p
            className="pt-2 text-center text-xs text-muted-foreground"
            aria-live="polite"
          >
            That's all {total}.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={footerRef}
      className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:justify-between"
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing {shown} of {total}
      </p>
      {capped && viewAll ? (
        <Button asChild variant="ghost" size="sm">
          <Link to={viewAll.to}>
            {viewAll.label}
            <ArrowRightIcon />
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-w-28"
          disabled={loading}
          onClick={() => {
            focusFromRef.current = shown;
            onLoadMore();
          }}
        >
          {loading ? <Spinner /> : "Load more"}
        </Button>
      )}
    </div>
  );
}
