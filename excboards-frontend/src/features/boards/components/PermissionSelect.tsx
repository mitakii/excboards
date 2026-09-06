import { cn } from "@/lib/utils";
import { PermissionLevel } from "../api";

export const PERMISSION_LEVELS = [
  {
    value: PermissionLevel.Viewer,
    label: "Viewer",
    hint: "Can view the board",
  },
  {
    value: PermissionLevel.Editor,
    label: "Editor",
    hint: "Can view and edit",
  },
  {
    value: PermissionLevel.Admin,
    label: "Admin",
    hint: "Can edit and manage collaborators",
  },
] as const;

/** Backend serializes PermissionLevel as its enum name in responses. */
export const PERMISSION_NAME_TO_LEVEL: Record<string, number> = {
  Viewer: PermissionLevel.Viewer,
  Editor: PermissionLevel.Editor,
  Admin: PermissionLevel.Admin,
};

interface PermissionSelectProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Show the "— Can view and edit" hint next to each label. */
  showHint?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

export function PermissionSelect({
  value,
  onChange,
  disabled,
  showHint = false,
  id,
  className,
  "aria-label": ariaLabel,
}: PermissionSelectProps) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        className,
      )}
    >
      {PERMISSION_LEVELS.map((level) => (
        <option key={level.value} value={level.value}>
          {showHint ? `${level.label} — ${level.hint}` : level.label}
        </option>
      ))}
    </select>
  );
}
