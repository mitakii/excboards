import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PagePagination } from "@/components/PagePagination";
import { BoardList } from "@/features/boards/components/BoardList";
import { searchBoards } from "@/lib/mockData";

const PAGE_SIZE = 6;

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [page, setPage] = useState(1);

  const { items, total } = searchBoards(query, page, PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8">
      <h1 className="text-lg font-semibold text-foreground">
        {query ? `Results for "${query}"` : "Public boards"}
      </h1>
      <p className="text-sm text-muted-foreground">{total} board{total === 1 ? "" : "s"} found</p>
      <BoardList boards={items} emptyMessage="No boards match your search." />
      {total > PAGE_SIZE && (
        <PagePagination page={page} onPageChange={setPage} pageLength={items.length} pageSize={PAGE_SIZE} />
      )}
    </div>
  );
}
