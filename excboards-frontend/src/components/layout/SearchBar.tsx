import { useEffect, useState, type ChangeEvent } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  defaultValue?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export function SearchBar({
  defaultValue = "",
  onSearch,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    const handle = setTimeout(() => onSearch(query), 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className={cn("relative w-full", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        placeholder="Search public boards"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setQuery(e.target.value)
        }
        className="pl-8"
      />
    </div>
  );
}
