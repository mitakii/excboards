import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { SEARCH_MODE_LABEL } from "../parseQuery";
import { useSearch } from "../queries";
import type { BoardSearchResult, UserSearchResult } from "../api";
import { BoardResultCard, UserResultCard } from "./ResultCards";

const SUGGESTION_LIMIT = 6;

interface SearchSuggestionsProps {
  /** Already-debounced query string. */
  query: string;
  /** Close the panel (a result was picked or "see all" was clicked). */
  onClose: () => void;
  /** Navigate to the full results page for the given query string. */
  onNavigateSearch: (query: string) => void;
}

export function SearchSuggestions({
  query,
  onClose,
  onNavigateSearch,
}: SearchSuggestionsProps) {
  const { parsed, enabled, data, isLoading, isError, error, isFetching } =
    useSearch(query, 1, SUGGESTION_LIMIT);

  if (!enabled) {
    return (
      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
        Search boards. Prefix <span className="font-medium">@</span> for users,{" "}
        <span className="font-medium">#tag</span> for boards by tag (add more:{" "}
        <span className="font-medium">#ux #api</span>).
      </div>
    );
  }

  const results = data?.envelope.result ?? [];
  const label = SEARCH_MODE_LABEL[parsed.mode];

  return (
    <div>
      <p className="px-3 pt-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
        {parsed.mode === "tag" && parsed.tags.length > 0 && (
          <span className="normal-case"> · {parsed.tags.map((t) => `#${t}`).join(" ")}</span>
        )}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-6 text-muted-foreground">
          <Spinner />
        </div>
      ) : isError ? (
        <p className="px-3 py-6 text-center text-xs text-destructive">
          {getErrorMessage(error, "Search failed.")}
        </p>
      ) : results.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-muted-foreground">
          {parsed.mode === "tag"
            ? "No boards carry all of those tags."
            : `No ${label.toLowerCase()} found.`}
        </p>
      ) : (
        <ul className="max-h-80 space-y-1 overflow-y-auto p-2">
          {data?.mode === "user"
            ? (results as UserSearchResult[]).map((user) => (
                <li key={user.userId}>
                  <UserResultCard user={user} onSelect={onClose} />
                </li>
              ))
            : (results as BoardSearchResult[]).map((board) => (
                <li key={board.id}>
                  <BoardResultCard board={board} onSelect={onClose} />
                </li>
              ))}
        </ul>
      )}

      {results.length > 0 && (
        <button
          type="button"
          onClick={() => {
            onNavigateSearch(parsed.raw);
            onClose();
          }}
          className="w-full border-t border-border px-3 py-2 text-center text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          See all results{isFetching ? "…" : ""}
        </button>
      )}
    </div>
  );
}
