import { useState } from "react";
import { Link } from "react-router-dom";
import { ArchiveIcon, ChevronLeftIcon, ChevronRightIcon, GlobeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { formatWorldBoardMonth } from "../api";
import { useArchivedWorldBoards } from "../queries";

const LIST_OPEN_STORAGE_KEY = "worldBoard.archiveOpen";

function readListOpen() {
  try {
    return localStorage.getItem(LIST_OPEN_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function writeListOpen(open: boolean) {
  try {
    localStorage.setItem(LIST_OPEN_STORAGE_KEY, String(open));
  } catch {
    // Preference just won't persist.
  }
}

export function WorldBoardSection() {
  const [listOpen, setListOpen] = useState(readListOpen);

  function toggleList() {
    setListOpen((open) => {
      writeListOpen(!open);
      return !open;
    });
  }

  return (
    <section className="grid gap-4 md:h-64 md:grid-cols-3">
      <div
        className={cn(
          "relative h-40 md:h-full",
          listOpen ? "md:col-span-2" : "md:col-span-3"
        )}
      >
        <Link
          to="/world"
          className="group flex size-full flex-col items-center justify-center gap-2 rounded-xl border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <GlobeIcon className="size-8 text-muted-foreground transition-transform group-hover:scale-110" />
          <span className="text-3xl font-semibold tracking-tight">World Board</span>
          <span className="text-sm text-muted-foreground">
            One shared board for everyone, fresh every month
          </span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleList}
          aria-expanded={listOpen}
          aria-controls="world-board-archive"
          aria-label={listOpen ? "Hide previous boards" : "Show previous boards"}
          title={listOpen ? "Hide previous boards" : "Show previous boards"}
          className="absolute top-1/2 right-2 -translate-y-1/2"
        >
          {listOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </Button>
      </div>

      {listOpen && (
        <aside
          id="world-board-archive"
          aria-label="Previous world boards"
          className="flex max-h-64 min-h-0 flex-col rounded-xl border bg-card shadow-sm animate-in fade-in-0 slide-in-from-right-2 duration-200 md:max-h-none"
        >
          <h3 className="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium text-foreground">
            <ArchiveIcon className="size-4 text-muted-foreground" />
            Previous boards
          </h3>
          <ArchiveList />
        </aside>
      )}
    </section>
  );
}

function ArchiveList() {
  const archive = useArchivedWorldBoards();

  if (archive.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  if (archive.isError) {
    return (
      <p className="p-4 text-sm text-destructive">Failed to load previous boards.</p>
    );
  }

  const boards = archive.data?.pages.flatMap((page) => page.result) ?? [];

  if (boards.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        No previous boards yet. Each month's board is archived here as read-only.
      </p>
    );
  }

  return (
    <ul className="min-h-0 flex-1 overflow-y-auto p-1">
      {boards.map((board) => (
        <li key={board.id}>
          <Link
            to={`/world/${board.id}`}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
          >
            <span>{formatWorldBoardMonth(board.createdAt)}</span>
            <span className="text-xs text-muted-foreground">Read-only</span>
          </Link>
        </li>
      ))}
      {archive.hasNextPage && (
        <li className="p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={archive.isFetchingNextPage}
            onClick={() => archive.fetchNextPage()}
          >
            {archive.isFetchingNextPage ? <Spinner /> : "Load more"}
          </Button>
        </li>
      )}
    </ul>
  );
}
