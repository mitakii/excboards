export type SearchMode = "user" | "tag" | "board";

export interface ParsedSearch {
  mode: SearchMode;
  term: string;
  tags: string[];
  raw: string;
}

export function parseSearchQuery(raw: string): ParsedSearch {
  const trimmed = raw.trim();

  if (trimmed.startsWith("@")) {
    return {
      mode: "user",
      term: trimmed.slice(1).trim(),
      tags: [],
      raw: trimmed,
    };
  }
  if (trimmed.startsWith("#")) {
    const tags = trimmed
      .split(/\s+/)
      .map((token) => token.replace(/^#+/, "").trim())
      .filter(Boolean);
    return { mode: "tag", term: tags.join(" "), tags, raw: trimmed };
  }
  return { mode: "board", term: trimmed, tags: [], raw: trimmed };
}

export const SEARCH_MODE_LABEL: Record<SearchMode, string> = {
  user: "Users",
  tag: "Boards by tag",
  board: "Boards",
};
