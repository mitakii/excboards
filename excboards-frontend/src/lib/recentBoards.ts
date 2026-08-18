const KEY = "excboards:recentBoards";
const LIMIT = 8;

export function getRecentBoardIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecentBoard(id: string) {
  const ids = [id, ...getRecentBoardIds().filter((existing) => existing !== id)];
  localStorage.setItem(KEY, JSON.stringify(ids.slice(0, LIMIT)));
}
