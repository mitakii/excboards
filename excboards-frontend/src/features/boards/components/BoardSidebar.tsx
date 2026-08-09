import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

interface BoardSidebarProps {
  name: string;
  description: string;
  onNameChange?: (name: string) => void;
  onDescriptionChange?: (description: string) => void;
  onSave?: () => void;
  saving?: boolean;
  readOnly?: boolean;
}

export function BoardSidebar({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSave,
  saving,
  readOnly = false,
}: BoardSidebarProps) {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 border-r border-border p-4">
      {readOnly ? (
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-foreground">{name}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      ) : (
        <>
          <Field>
            <FieldLabel htmlFor="board-name">Board name</FieldLabel>
            <Input
              id="board-name"
              value={name}
              onChange={(e) => onNameChange?.(e.target.value)}
              placeholder="Untitled board"
              maxLength={200}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="board-description">Description</FieldLabel>
            <Input
              id="board-description"
              value={description}
              onChange={(e) => onDescriptionChange?.(e.target.value)}
              placeholder="Optional"
              maxLength={1000}
            />
          </Field>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Spinner />}
            Save board
          </Button>
        </>
      )}
      <Separator className="mt-auto" />
      <p className="text-xs text-muted-foreground">excboards</p>
    </aside>
  );
}
