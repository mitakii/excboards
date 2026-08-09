import { api } from "@/lib/api";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAtUtc: string;
  profilePictureUrl: string;
}

export async function getUserByUsername(username: string) {
  const res = await api.get<UserProfile>(`/api/User/username/${encodeURIComponent(username)}`);
  return res.data;
}
