import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PagePagination } from "@/components/PagePagination";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { SEARCH_MODE_LABEL } from "./parseQuery";
import { useSearch } from "./queries";
import type { UserSearchResult } from "./api";
import { BoardResults } from "./components/BoardResults";
import { UserResultCard } from "./components/ResultCards";

const PAGE_SIZE = 12;

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get("q") ?? "";
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [raw]);

  const { parsed, enabled, data, isLoading, isError, error } = useSearch(
    raw,
    page,
    PAGE_SIZE
  );

  const results = data?.envelope.result ?? [];
  const boardResults =
    data && data.mode !== "user" ? data.envelope.result : [];
  const modeLabel = SEARCH_MODE_LABEL[parsed.mode];
  const heading =
    parsed.mode === "tag"
      ? parsed.tags.map((t) => `#${t}`).join(" ")
      : parsed.term;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          {heading ? `${modeLabel} · ${heading}` : "Search"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {parsed.mode === "user"
            ? "Searching users — remove the @ to search boards."
            : parsed.mode === "tag"
              ? "Boards carrying every tag listed. Add more with spaces: #ux #api"
              : "Searching boards — use @name for users, #tag for boards by tag."}
        </p>
      </div>

      {!enabled ? (
        <p className="text-sm text-muted-foreground">
          Type something to search.
        </p>
      ) : isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Spinner />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(error, "Search failed.")}
        </p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {parsed.mode === "tag"
            ? `No boards carry all of ${heading}.`
            : `No ${modeLabel.toLowerCase()} found for “${parsed.term}”.`}
        </p>
      ) : data?.mode === "user" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(results as UserSearchResult[]).map((user) => (
            <UserResultCard key={user.userId} user={user} />
          ))}
        </div>
      ) : (
        <BoardResults boards={boardResults} />
      )}

      {enabled && (page > 1 || results.length >= PAGE_SIZE) && (
        <PagePagination
          page={page}
          onPageChange={setPage}
          pageLength={results.length}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  );
}
