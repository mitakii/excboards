import { useState } from "react";
import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TagBadgeEditor({
  tags,
  onTagsChange,
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) onTagsChange([...tags, trimmed]);
    setInput("");
  }

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button type="button" aria-label={`Remove ${tag}`} onClick={() => onTagsChange(tags.filter((t) => t !== tag))}>
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Add a tag"
          maxLength={40}
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>
          Add
        </Button>
      </div>
    </div>
  );
}
