const KEY = "excboards:recentUsers";
const LIMIT = 8;

export function getRecentUsernames(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecentUser(username: string) {
  const usernames = [username, ...getRecentUsernames().filter((existing) => existing !== username)];
  localStorage.setItem(KEY, JSON.stringify(usernames.slice(0, LIMIT)));
}
