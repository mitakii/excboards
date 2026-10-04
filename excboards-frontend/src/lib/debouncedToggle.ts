interface ToggleHooks<R> {
  /** Writes the value into the UI cache: called right away, and with the old value on failure. */
  apply: (value: boolean) => void;
  /** isLatest is false when newer clicks are already waiting, so their value must not be overwritten. */
  onSuccess?: (result: R, isLatest: boolean) => void;
  onError?: (err: unknown) => void;
  onSettled?: () => void;
}

interface Pending {
  timer: ReturnType<typeof setTimeout>;
  /** Server state before this burst of clicks started. */
  confirmed: boolean;
}

/**
 * Per-id debounced on/off toggle for spam-prone buttons (bookmark, like).
 * The UI flips on every click; the request goes out once clicks stop for delayMs,
 * and not at all when they cancel out (on → off → on → off). Requests for one id
 * stay in order. State is module-level, so every button for the same id shares it
 * and a pending save survives the clicked component unmounting.
 */
export function createDebouncedToggle<R>(
  send: (id: string, value: boolean) => Promise<R>,
  delayMs = 500
) {
  const pending = new Map<string, Pending>();
  const inFlight = new Map<string, Promise<unknown>>();

  return function toggle(id: string, value: boolean, hooks: ToggleHooks<R>) {
    const current = pending.get(id);
    if (current) clearTimeout(current.timer);
    const confirmed = current ? current.confirmed : !value;

    hooks.apply(value);

    const timer = setTimeout(async () => {
      pending.delete(id);
      if (value === confirmed) return;

      await inFlight.get(id)?.catch(() => undefined);
      const request = send(id, value);
      inFlight.set(id, request);

      try {
        const result = await request;
        hooks.onSuccess?.(result, !pending.has(id));
      } catch (err) {
        if (!pending.has(id)) hooks.apply(confirmed);
        hooks.onError?.(err);
      } finally {
        if (inFlight.get(id) === request) inFlight.delete(id);
        hooks.onSettled?.();
      }
    }, delayMs);

    pending.set(id, { timer, confirmed });
  };
}
