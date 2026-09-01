const KEY = "excboards:recentBoards";
const LIMIT = 8;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Subscribe to changes (same-tab mutations + cross-tab `storage` events). */
export function subscribeRecentBoards(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

let snapshotRaw: string | null = null;
let snapshot: string[] = [];

export function getRecentBoardIds(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== snapshotRaw) {
    snapshotRaw = raw;
    try {
      snapshot = raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      snapshot = [];
    }
  }
  return snapshot;
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // ignore (private mode / quota)
  }
  emit();
}

export function addRecentBoard(id: string) {
  const ids = [
    id,
    ...getRecentBoardIds().filter((existing) => existing !== id),
  ];
  write(ids.slice(0, LIMIT));
}

export function removeRecentBoard(id: string) {
  write(getRecentBoardIds().filter((existing) => existing !== id));
}

export function clearRecentBoards() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  emit();
}
