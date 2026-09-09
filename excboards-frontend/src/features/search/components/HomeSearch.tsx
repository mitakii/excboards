import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { SearchSuggestions } from "./SearchSuggestions";

/**
 * Homepage search box: debounced suggestions drop into a panel that floats over
 * the page. Enter (or "see all") goes to the full /search results page.
 */
export function HomeSearch({ className }: { className?: string }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(value, 300);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function goToSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  }

  const panelOpen = open && value.trim().length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          goToSearch(value);
        }}
      >
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={value}
            placeholder="Search boards, @users, #tags"
            role="combobox"
            aria-expanded={panelOpen}
            aria-controls="home-search-suggestions"
            className="pl-8"
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          />
        </div>
      </form>

      {panelOpen && (
        <div
          id="home-search-suggestions"
          className="absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
        >
          <SearchSuggestions
            query={debounced}
            onClose={() => setOpen(false)}
            onNavigateSearch={goToSearch}
          />
        </div>
      )}
    </div>
  );
}
