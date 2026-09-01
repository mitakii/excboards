const KEY = "excboards:recentUsers";
const LIMIT = 8;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeRecentUsers(listener: () => void) {
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

export function getRecentUsernames(): string[] {
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

function write(usernames: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(usernames));
  } catch {
    // ignore (private mode / quota)
  }
  emit();
}

export function addRecentUser(username: string) {
  const usernames = [
    username,
    ...getRecentUsernames().filter((existing) => existing !== username),
  ];
  write(usernames.slice(0, LIMIT));
}

export function removeRecentUser(username: string) {
  write(getRecentUsernames().filter((existing) => existing !== username));
}

export function clearRecentUsers() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  emit();
}
