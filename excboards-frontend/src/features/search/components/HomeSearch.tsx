import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon, XIcon } from "lucide-react";
import { BoardOverviewDialog } from "@/features/boards/components/BoardOverviewDialog";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { SearchSuggestions } from "./SearchSuggestions";

const LISTBOX_ID = "home-search-suggestions";
const optionId = (index: number) => `${LISTBOX_ID}-option-${index}`;

/** "/" focuses the search unless the user is already typing somewhere. */
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function HomeSearch({
  className,
  initialValue = "",
}: {
  className?: string;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [overviewBoardId, setOverviewBoardId] = useState<string | null>(null);
  const debounced = useDebouncedValue(value, 300);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // New results invalidate the highlighted row.
  useEffect(() => {
    setActiveIndex(-1);
  }, [debounced]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function goToSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
    inputRef.current?.blur();
  }

  function optionCount() {
    return (
      document
        .getElementById(LISTBOX_ID)
        ?.querySelectorAll("[data-search-option]").length ?? 0
    );
  }

  function moveActive(step: 1 | -1) {
    const count = optionCount();
    if (count === 0) return;
    setActiveIndex((index) => (index + step + count) % count);
  }

  function setQuery(next: string) {
    setValue(next);
    setOpen(true);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const active =
            activeIndex >= 0 ? document.getElementById(optionId(activeIndex)) : null;
          if (open && active) active.click();
          else goToSearch(value);
        }}
      >
        <div
          className={cn(
            "group flex h-11 items-center gap-2.5 rounded-xl border border-input bg-muted/40 px-3.5 shadow-xs transition-[background-color,border-color,box-shadow]",
            "hover:bg-muted/60 focus-within:border-ring focus-within:bg-background focus-within:ring-3 focus-within:ring-ring/20 dark:bg-input/30 dark:focus-within:bg-input/40"
          )}
        >
          <SearchIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-focus-within:text-foreground" />
          <input
            ref={inputRef}
            value={value}
            placeholder="Search boards, @users, #tags"
            aria-label="Search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={LISTBOX_ID}
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            autoComplete="off"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                if (open) setOpen(false);
                else inputRef.current?.blur();
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                moveActive(1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                moveActive(-1);
              }
            }}
          />
          {value ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="-mr-1 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : (
            <kbd className="hidden h-5 min-w-5 shrink-0 items-center justify-center rounded border border-border bg-background px-1 font-sans text-[11px] text-muted-foreground group-focus-within:hidden sm:flex">
              /
            </kbd>
          )}
        </div>
      </form>

      {open && (
        <div
          className="absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 slide-in-from-top-1 duration-150"
        >
          <SearchSuggestions
            listboxId={LISTBOX_ID}
            optionId={optionId}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            query={debounced}
            pending={debounced !== value}
            onClose={() => setOpen(false)}
            onNavigateSearch={goToSearch}
            onOpenOverview={setOverviewBoardId}
            onInsertPrefix={setQuery}
          />
        </div>
      )}

      <BoardOverviewDialog
        boardId={overviewBoardId ?? ""}
        open={overviewBoardId !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setOverviewBoardId(null);
        }}
      />
    </div>
  );
}
