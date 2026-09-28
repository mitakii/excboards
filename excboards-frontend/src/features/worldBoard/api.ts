import { api, type PagedEnvelope } from "@/lib/api";

export const WORLD_BOARD_API = "/api/worldboard" as const;

/** Mirrors backend Application.Dto.WorldBoardDto. */
export interface WorldBoard {
  id: string;
  /** DateOnly, "YYYY-MM-DD" — the first day of the board's month. */
  createdAt: string;
  isReadOnly: boolean;
}

export async function getCurrentWorldBoard() {
  const res = await api.get<WorldBoard>(`${WORLD_BOARD_API}/current`);
  return res.data;
}

export async function getWorldBoard(id: string) {
  const res = await api.get<WorldBoard>(`${WORLD_BOARD_API}/${id}`);
  return res.data;
}

export async function listArchivedWorldBoards(page: number, pageSize: number) {
  const res = await api.get<PagedEnvelope<WorldBoard>>(
    `${WORLD_BOARD_API}/archive`,
    { params: { page, pageSize } }
  );
  return res.data;
}

/** "September 2026" — parsed as a local date so the month never shifts by timezone. */
export function formatWorldBoardMonth(createdAt: string) {
  const [year, month] = createdAt.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}
