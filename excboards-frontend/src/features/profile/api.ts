import { isAxiosError } from "axios";
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

export async function getUserById(id: string) {
  const res = await api.get<UserProfile>(`/api/User/${id}`);
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
  try {
    const res = await api.get<SearchResponse<UserSearchResult>>(
      "/api/search/user",
      { params: { query, page, pageSize } },
    );
    return res.data;
  } catch (err) {
    // The backend returns 404 (not an empty list) when nothing matches.
    if (isAxiosError(err) && err.response?.status === 404) {
      return { result: [], totalCount: 0, currentPage: page, pageSize };
    }
    throw err;
  }
}
