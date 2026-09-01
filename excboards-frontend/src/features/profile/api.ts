import { api } from "@/lib/api";

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  createdAtUtc: string;
  profilePictureUrl: string;
}

export async function getUserByUsername(username: string) {
  const res = await api.get<UserProfile>(`/api/User/username/${encodeURIComponent(username)}`);
  return res.data;
}

export interface UserSearchResult {
  userId: string;
  username: string;
  email: string;
  createdAtUtc: string;
  profilePictureUrl: string;
}

interface SearchResponse<T> {
  result: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export async function searchUsers(query: string, page = 1, pageSize = 10) {
  const res = await api.get<SearchResponse<UserSearchResult>>(
    "/api/User/search",
    { params: { query, page, pageSize } },
  );
  return res.data;
}
