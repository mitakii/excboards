import { useState } from "react";
import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// tag search splits on whitespace, so each tag must be a single word
export function isValidTag(tag: string) {
  return !/\s/.test(tag.trim());
}

export const TAG_ERROR = "Tags must be one word. Use - or _ to join words.";

export function TagBadgeEditor({
  tags,
  onTagsChange,
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const inputInvalid = !isValidTag(input);
  const hasInvalidTag = tags.some((t) => !isValidTag(t));

  function addTag() {
    const trimmed = input.trim();
    if (!isValidTag(trimmed)) return;
    if (trimmed && !tags.includes(trimmed)) onTagsChange([...tags, trimmed]);
    setInput("");
  }

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={cn("gap-1", !isValidTag(tag) && "bg-destructive/10 text-destructive")}
            >
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
          aria-invalid={inputInvalid}
        />
        {/* sized and bordered like the Input beside it */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-md border-input shadow-xs"
          onClick={addTag}
          disabled={inputInvalid}
        >
          Add
        </Button>
      </div>
      {(inputInvalid || hasInvalidTag) && (
        <p className="text-sm text-destructive">{TAG_ERROR}</p>
      )}
    </div>
  );
}
