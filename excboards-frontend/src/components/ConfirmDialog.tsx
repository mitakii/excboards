import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  /** Returning a promise keeps the dialog open (with a spinner) until it settles. */
  onConfirm: () => void | Promise<void>;
  /** Icon shown in a tinted badge above the title. */
  icon?: React.ReactNode;
  /** Extra content between the header and the buttons. */
  children?: React.ReactNode;
  /** "sm" = compact, centered, side-by-side buttons. */
  size?: "default" | "sm";
  /** Uncontrolled: render a trigger element. */
  trigger?: React.ReactNode;
  /** Controlled: e.g. opened from a dropdown-menu item. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  onConfirm,
  icon,
  children,
  size = "default",
  trigger,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isOpen = open ?? uncontrolledOpen;

  function setOpen(next: boolean) {
    if (pending) return;
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  async function handleConfirm(e: React.MouseEvent) {
    const result = onConfirm();
    if (!(result instanceof Promise)) return;

    e.preventDefault();
    setPending(true);
    try {
      await result;
      setPending(false);
      setOpen(false);
    } catch {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          {icon && (
            <AlertDialogMedia
              className={cn(
                "rounded-full",
                confirmVariant === "destructive"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              )}
            >
              {icon}
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={confirmVariant}
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending && <Spinner />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
