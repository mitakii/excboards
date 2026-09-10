import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ClampTextProps extends React.ComponentProps<"p"> {
  /** Max lines shown before the text is clamped. */
  lines?: number;
}

/**
 * Renders text that shows in full up to `lines` lines. If it would overflow,
 * it stays capped at `lines` and fades out at the bottom instead of showing an
 * ellipsis. The fade is only applied once the text is actually truncated.
 */
export function ClampText({
  lines = 3,
  className,
  style,
  children,
  ...props
}: ClampTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => setClamped(el.scrollHeight - el.clientHeight > 1);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, lines]);

  return (
    <p
      ref={ref}
      data-clamped={clamped || undefined}
      className={cn("fade-text", className)}
      style={{ maxHeight: `${lines}lh`, ...style }}
      {...props}
    >
      {children}
    </p>
  );
}
