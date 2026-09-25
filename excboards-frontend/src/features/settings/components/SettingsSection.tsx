import type { ReactNode } from "react";
import { CheckIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Submit button row with a success note; server errors are shown as toasts. */
export function SettingsSubmit({
  label,
  isSubmitting,
  saved,
}: {
  label: string;
  isSubmitting: boolean;
  saved: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting && <Spinner />}
        {label}
      </Button>
      {saved && !isSubmitting && (
        <span className="flex items-center gap-1 text-sm text-muted-foreground animate-in fade-in-0">
          <CheckIcon className="size-4" />
          Saved
        </span>
      )}
    </div>
  );
}
