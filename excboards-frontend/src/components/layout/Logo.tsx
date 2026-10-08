import { cn } from "@/lib/utils";

/** App mark: a board tile with a pen stroke. Follows the theme via currentColor/--background. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-6 shrink-0", className)}
    >
      <rect x="2" y="2" width="28" height="28" rx="8" fill="currentColor" />
      <path
        d="M9 18.5c1.8-4.4 3.8-4.4 5.3 0s3.6 4.4 5.4 0c.8-1.8 1.7-2.9 3.3-3.3"
        style={{ stroke: "var(--background)" }}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
