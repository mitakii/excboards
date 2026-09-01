import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BoardList } from "@/features/boards/components/BoardList";
import { getAllTags, getRecommendedBoards } from "@/lib/mockData";

export function RecommendedByTagSection() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tags = getAllTags();
  const boards = getRecommendedBoards(activeTag ?? undefined);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Recommended for you</h2>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeTag === null ? "secondary" : "outline"}
          onClick={() => setActiveTag(null)}
        >
          All
        </Button>
        {tags.map((tag) => (
          <Button
            key={tag}
            size="sm"
            variant={activeTag === tag ? "secondary" : "outline"}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </Button>
        ))}
      </div>
      <BoardList boards={boards} layout="list" emptyMessage="No boards for this tag yet." />
    </section>
  );
}
