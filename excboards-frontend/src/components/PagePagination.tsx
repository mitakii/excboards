import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PagePaginationProps {
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  /** Total number of items across all pages, as reported by the backend. */
  total: number;
}

export function PagePagination({
  page,
  onPageChange,
  pageSize,
  total,
}: PagePaginationProps) {
  const hasPreviousPage = page > 1;
  const hasNextPage = page * pageSize < total;

  return (
    <Pagination className="mt-2 mb-0 justify-start">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            className={hasPreviousPage ? undefined : "pointer-events-none opacity-50"}
            onClick={() => hasPreviousPage && onPageChange(page - 1)}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            className={hasNextPage ? undefined : "pointer-events-none opacity-50"}
            onClick={() => hasNextPage && onPageChange(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
