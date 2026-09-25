import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ExcalidrawMiscToolPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const find = () =>
      document.querySelector<HTMLElement>(".mobile-misc-tools-container");

    setContainer(find());

    const observer = new MutationObserver(() => {
      const next = find();
      setContainer((prev) => (next === prev ? prev : next));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!container) return null;
  return createPortal(children, container);
}
