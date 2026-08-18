// Placeholder data for features the backend doesn't support yet: public board
// discovery, tag recommendations, recently-viewed tracking, other-user
// profiles, and board collaborator lists. None of this hits the real API —
// every function here is a pure, synchronous stand-in so it's a drop-in swap
// once real endpoints exist.

export interface MockBoardOwner {
  username: string;
  pfpUrl?: string;
}

export interface MockBoard {
  id: string;
  name: string;
  description: string;
  tags: string[];
  owner: MockBoardOwner;
  updatedAt: string;
}

export interface MockUserProfile {
  username: string;
  pfpUrl?: string;
  description: string;
}

export interface MockCollaborator {
  userId: string;
  username: string;
  permission: "Viewer" | "Editor";
}

const MOCK_COLLABORATORS: MockCollaborator[] = [
  { userId: "u1", username: "amelia-dev", permission: "Editor" },
  { userId: "u2", username: "jorge.p", permission: "Viewer" },
];

const OWNERS: MockBoardOwner[] = [
  { username: "amelia-dev" },
  { username: "jorge.p" },
  { username: "kwabena" },
  { username: "mina_k" },
  { username: "theo-writes" },
];

const MOCK_BOARDS: MockBoard[] = [
  { id: "b1", name: "Onboarding flow v3", description: "Wireframes for the new signup funnel", tags: ["ux", "flowchart"], owner: OWNERS[0], updatedAt: "2026-07-30" },
  { id: "b2", name: "System architecture", description: "Service boundaries and data flow", tags: ["architecture", "backend"], owner: OWNERS[1], updatedAt: "2026-07-28" },
  { id: "b3", name: "Sprint retro board", description: "What went well, what didn't", tags: ["retro", "team"], owner: OWNERS[2], updatedAt: "2026-07-27" },
  { id: "b4", name: "Mind map: Q3 goals", description: "Brainstorm for quarterly planning", tags: ["planning", "mindmap"], owner: OWNERS[3], updatedAt: "2026-07-25" },
  { id: "b5", name: "Database ER diagram", description: "Core entities and relations", tags: ["architecture", "database"], owner: OWNERS[1], updatedAt: "2026-07-24" },
  { id: "b6", name: "User journey map", description: "End-to-end customer experience", tags: ["ux", "research"], owner: OWNERS[4], updatedAt: "2026-07-22" },
  { id: "b7", name: "API gateway sketch", description: "Routing rules across services", tags: ["architecture", "backend"], owner: OWNERS[2], updatedAt: "2026-07-20" },
  { id: "b8", name: "Design system tokens", description: "Color, spacing, and type scale", tags: ["design", "ux"], owner: OWNERS[0], updatedAt: "2026-07-18" },
  { id: "b9", name: "Incident postmortem", description: "Timeline of the July outage", tags: ["retro", "backend"], owner: OWNERS[3], updatedAt: "2026-07-15" },
  { id: "b10", name: "Feature brainstorm", description: "Ideas for the next release", tags: ["planning", "mindmap"], owner: OWNERS[4], updatedAt: "2026-07-12" },
  { id: "b11", name: "Class diagram: auth module", description: "Object relationships for login/refresh", tags: ["architecture", "backend"], owner: OWNERS[1], updatedAt: "2026-07-10" },
  { id: "b12", name: "Competitor teardown", description: "Comparing three tools in our space", tags: ["research", "planning"], owner: OWNERS[2], updatedAt: "2026-07-08" },
];

const RECENTLY_VIEWED_IDS = ["b3", "b5", "b8"];

export function getAllTags(): string[] {
  return [...new Set(MOCK_BOARDS.flatMap((board) => board.tags))].sort();
}

export function getRecommendedBoards(tag?: string): MockBoard[] {
  if (!tag) return MOCK_BOARDS.slice(0, 6);
  return MOCK_BOARDS.filter((board) => board.tags.includes(tag));
}

export function getRecentlyViewedBoards(): MockBoard[] {
  return RECENTLY_VIEWED_IDS.map((id) => MOCK_BOARDS.find((board) => board.id === id)).filter(
    (board): board is MockBoard => board != null,
  );
}

export function searchBoards(query: string, page: number, pageSize: number) {
  const normalized = query.trim().toLowerCase();
  const matches = normalized
    ? MOCK_BOARDS.filter(
        (board) =>
          board.name.toLowerCase().includes(normalized) ||
          board.description.toLowerCase().includes(normalized) ||
          board.tags.some((tag) => tag.includes(normalized)),
      )
    : MOCK_BOARDS;

  const start = (page - 1) * pageSize;
  return {
    items: matches.slice(start, start + pageSize),
    total: matches.length,
  };
}

export function getUserProfile(username: string): MockUserProfile {
  return {
    username,
    description: "Placeholder bio — user descriptions aren't stored by the backend yet.",
  };
}

export function getBoardCollaborators(_boardId: string): MockCollaborator[] {
  return MOCK_COLLABORATORS;
}

export function getUserBoards(username: string, page: number, pageSize: number) {
  // Real registered usernames won't match any placeholder owner, so fall back
  // to a generic slice rather than showing an empty profile for every real account.
  const owned = MOCK_BOARDS.filter((board) => board.owner.username === username);
  const source = owned.length > 0 ? owned : MOCK_BOARDS;
  const start = (page - 1) * pageSize;
  return {
    items: source.slice(start, start + pageSize),
    total: source.length,
  };
}
