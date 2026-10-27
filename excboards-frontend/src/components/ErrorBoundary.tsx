import { Component, type ErrorInfo, type ReactNode } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
  resetKey: unknown;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState
  ): Partial<ErrorBoundaryState> | null {
    return props.resetKey !== state.resetKey
      ? { error: null, resetKey: props.resetKey }
      : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <TriangleAlertIcon className="size-10 text-destructive" />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. Reloading the page usually fixes it.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    );
  }
}
