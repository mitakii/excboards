import { isAxiosError } from "axios";
import { api, emptyCursorEnvelope, type CursorEnvelope } from "@/lib/api";

export interface UserProfile {
  userId: string;
  username: string;
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
  createdAtUtc: string;
  profilePictureUrl: string;
}

/** First page of matching users (used by pickers that don't need "load more"). */
export async function searchUsers(query: string, pageSize = 10) {
  try {
    const res = await api.get<CursorEnvelope<UserSearchResult>>(
      "/api/search/user",
      { params: { query, pageSize } },
    );
    return res.data;
  } catch (err) {
    // The backend returns 404 (not an empty list) when nothing matches.
    if (isAxiosError(err) && err.response?.status === 404) {
      return emptyCursorEnvelope<UserSearchResult>();
    }
    throw err;
  }
}
