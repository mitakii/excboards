import { Link } from "react-router-dom";
import {
  AtSignIcon,
  CornerDownLeftIcon,
  HashIcon,
  LayoutDashboardIcon,
  SearchIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SEARCH_MODE_LABEL } from "../parseQuery";
import { useSearch } from "../queries";
import type { BoardSearchResult, UserSearchResult } from "../api";

const SUGGESTION_LIMIT = 6;

interface SearchSuggestionsProps {
  listboxId: string;
  optionId: (index: number) => string;
  /** Row highlighted via the keyboard, -1 for none. */
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  /** Already-debounced query string. */
  query: string;
  /** The input has changed since `query` was debounced. */
  pending: boolean;
  /** Close the panel (a result was picked or "see all" was clicked). */
  onClose: () => void;
  /** Navigate to the full results page for the given query string. */
  onNavigateSearch: (query: string) => void;
  /** Open the board overview dialog for a board result. */
  onOpenOverview: (boardId: string) => void;
  /** Replace the input with a search prefix (e.g. "@") from the tips. */
  onInsertPrefix: (prefix: string) => void;
}

const rowClass = (active: boolean) =>
  cn(
    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none transition-colors",
    active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
  );

const TIPS = [
  { prefix: "", icon: LayoutDashboardIcon, label: "Boards", hint: "Type a board name" },
  { prefix: "@", icon: AtSignIcon, label: "Users", hint: "Start with @" },
  { prefix: "#", icon: HashIcon, label: "Tags", hint: "Start with #, combine #ux #api" },
] as const;

function SearchTips({ onInsertPrefix }: { onInsertPrefix: (prefix: string) => void }) {
  return (
    <div className="p-1.5">
      <p className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">
        Search for
      </p>
      {TIPS.map(({ prefix, icon: Icon, label, hint }) => (
        <button
          key={label}
          type="button"
          onClick={() => onInsertPrefix(prefix)}
          className={rowClass(false)}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="ml-auto text-xs text-muted-foreground">{hint}</span>
        </button>
      ))}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-1 p-1.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 px-2.5 py-2">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchSuggestions({
  listboxId,
  optionId,
  activeIndex,
  onActiveIndexChange,
  query,
  pending,
  onClose,
  onNavigateSearch,
  onOpenOverview,
  onInsertPrefix,
}: SearchSuggestionsProps) {
  const { parsed, enabled, data, isLoading, isError, error, isFetching } =
    useSearch(query, 1, SUGGESTION_LIMIT);

  if (!enabled) {
    if (pending) return <LoadingRows />;
    // A bare "@" or "#": the mode is picked, only the term is missing.
    if (parsed.mode !== "board") {
      return (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          {parsed.mode === "user"
            ? "Type a username after @"
            : "Type a tag after #, combine several like #ux #api"}
        </p>
      );
    }
    return <SearchTips onInsertPrefix={onInsertPrefix} />;
  }

  const results = data?.envelope.result ?? [];
  const label = SEARCH_MODE_LABEL[parsed.mode];

  const optionProps = (index: number) => ({
    id: optionId(index),
    role: "option" as const,
    "aria-selected": index === activeIndex,
    "data-search-option": "",
    onMouseMove: () => {
      if (index !== activeIndex) onActiveIndexChange(index);
    },
  });

  return (
    <div className={cn("transition-opacity", (isFetching || pending) && !isLoading && "opacity-70")}>
      <p className="flex items-center gap-1 px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground">
        {label}
        {parsed.mode === "tag" && parsed.tags.length > 0 && (
          <span className="truncate font-normal">
            · {parsed.tags.map((t) => `#${t}`).join(" ")}
          </span>
        )}
      </p>

      {isLoading ? (
        <LoadingRows />
      ) : isError ? (
        <p className="px-4 py-8 text-center text-sm text-destructive">
          {getErrorMessage(error, "Search failed.")}
        </p>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
          <SearchIcon className="mb-1 size-5 text-muted-foreground/60" />
          <p className="text-sm font-medium text-foreground">No results</p>
          <p className="text-xs text-muted-foreground">
            {parsed.mode === "tag"
              ? "No boards carry all of those tags."
              : `No ${label.toLowerCase()} match “${parsed.term}”.`}
          </p>
        </div>
      ) : (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="max-h-80 overflow-y-auto p-1.5"
        >
          {data?.mode === "user"
            ? (results as UserSearchResult[]).map((user, index) => (
                <li key={user.userId}>
                  <Link
                    to={`/${user.username}`}
                    onClick={onClose}
                    className={rowClass(index === activeIndex)}
                    {...optionProps(index)}
                  >
                    <Avatar className="size-8 rounded-md">
                      {user.profilePictureUrl && (
                        <AvatarImage src={user.profilePictureUrl} alt="" />
                      )}
                      <AvatarFallback className="rounded-md text-xs">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium text-foreground">
                      @{user.username}
                    </span>
                  </Link>
                </li>
              ))
            : (results as BoardSearchResult[]).map((board, index) => (
                <li key={board.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOverview(board.id);
                    }}
                    className={rowClass(index === activeIndex)}
                    {...optionProps(index)}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                      <LayoutDashboardIcon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {board.name}
                      </span>
                      {board.description && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {board.description}
                        </span>
                      )}
                    </span>
                    {board.tags.length > 0 && (
                      <span className="hidden shrink-0 gap-1.5 text-xs text-muted-foreground sm:flex">
                        {board.tags.slice(0, 2).map((tag) => (
                          <span key={tag.id}>#{tag.name}</span>
                        ))}
                        {board.tags.length > 2 && <span>+{board.tags.length - 2}</span>}
                      </span>
                    )}
                  </button>
                </li>
              ))}
        </ul>
      )}

      {results.length > 0 && (
        <button
          type="button"
          onClick={() => onNavigateSearch(parsed.raw)}
          className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        >
          <SearchIcon className="size-3.5" />
          <span className="truncate">
            See all results for{" "}
            <span className="font-medium text-foreground">{parsed.raw}</span>
          </span>
          <kbd className="ml-auto flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-sans text-[11px]">
            <CornerDownLeftIcon className="size-3" />
          </kbd>
        </button>
      )}
    </div>
  );
}
