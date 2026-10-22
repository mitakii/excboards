import { useSearchParams } from "react-router-dom";
import { LoadMore } from "@/components/LoadMore";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { SEARCH_MODE_LABEL } from "./parseQuery";
import { useInfiniteSearch } from "./queries";
import type { BoardSearchResult, UserSearchResult } from "./api";
import { BoardResults } from "./components/BoardResults";
import { HomeSearch } from "./components/HomeSearch";
import { UserResultCard } from "./components/ResultCards";

const PAGE_SIZE = 12;

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get("q") ?? "";
  // A new query is a new cache key, so it starts again from the first page.
  const {
    parsed,
    enabled,
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteSearch(raw, PAGE_SIZE);

  const mode = data?.pages[0]?.mode;
  const seen = new Set<string>();
  const results = (data?.pages ?? [])
    .flatMap((page) => page.envelope.result as (UserSearchResult | BoardSearchResult)[])
    .filter((item) => {
      const key = "userId" in item ? item.userId : item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const totalCount = Math.max(data?.pages[0]?.envelope.totalCount ?? 0, results.length);
  const boardResults = mode !== "user" ? (results as BoardSearchResult[]) : [];
  const modeLabel = SEARCH_MODE_LABEL[parsed.mode];
  const heading =
    parsed.mode === "tag"
      ? parsed.tags.map((t) => `#${t}`).join(" ")
      : parsed.term;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8">
      <HomeSearch initialValue={raw} className="mx-auto max-w-xl" />

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
      ) : mode === "user" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(results as UserSearchResult[]).map((user, index) => (
            <div key={user.userId} data-list-index={index} className="grid">
              <UserResultCard user={user} />
            </div>
          ))}
        </div>
      ) : (
        <BoardResults boards={boardResults} />
      )}

      {enabled && !isLoading && !isError && (
        <LoadMore
          shown={results.length}
          total={totalCount}
          hasMore={!!hasNextPage}
          loading={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
          pagesLoaded={data?.pages.length}
        />
      )}
    </div>
  );
}
