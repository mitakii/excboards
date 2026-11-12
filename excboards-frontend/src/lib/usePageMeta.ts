import { useEffect } from "react";

interface PageMeta {
  title?: string;
  description?: string;
  noindex?: boolean;
}

const MAX_DESCRIPTION = 160;

const defaultTitle = document.title;
const descriptionMeta = document.querySelector<HTMLMetaElement>(
  'meta[name="description"]'
);
const defaultDescription = descriptionMeta?.content ?? "";

function clampDescription(text: string) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > MAX_DESCRIPTION
    ? `${flat.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…`
    : flat;
}

export function usePageMeta({ title, description, noindex = false }: PageMeta) {
  useEffect(() => {
    document.title = title ?? defaultTitle;
    if (descriptionMeta) {
      descriptionMeta.content = description
        ? clampDescription(description)
        : defaultDescription;
    }

    let robots: HTMLMetaElement | null = null;
    if (noindex) {
      robots = document.createElement("meta");
      robots.name = "robots";
      robots.content = "noindex";
      document.head.appendChild(robots);
    }

    return () => {
      document.title = defaultTitle;
      if (descriptionMeta) descriptionMeta.content = defaultDescription;
      robots?.remove();
    };
  }, [title, description, noindex]);
}
