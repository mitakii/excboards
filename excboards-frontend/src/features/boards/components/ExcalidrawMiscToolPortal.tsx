import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders `children` into Excalidraw's mobile "misc tools" cluster — the
 * vertical strip on the right that holds the Library / pen / lock / hand
 * buttons. Excalidraw exposes no slot for this, so we portal into its internal
 * `.mobile-misc-tools-container` node (present on mobile only). If that element
 * isn't there (desktop, or a future Excalidraw that renamed it) this renders
 * nothing and the caller's `renderTopRightUI` fallback takes over.
 */
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
