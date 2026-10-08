import { isAxiosError } from "axios";
import { api } from "@/lib/api";

export interface AuthUser {
  userId: string;
  userName: string;
  email: string;
}

/**
 * The signed-in user, or null when not logged in. Not being logged in is a normal
 * result, not an error: an errored query with no data refetches (and goes back to
 * "pending") every time another useStatus() mounts, which made pages flash their
 * loading state and unmount open dialogs for anonymous visitors.
 */
export async function fetchStatus(): Promise<AuthUser | null> {
  try {
    const res = await api.get<AuthUser>("/api/auth/status");
    return res.data;
  } catch (err) {
    // 401 from /status, or from /refresh when the interceptor's retry also fails
    if (
      isAxiosError(err) &&
      (err.response?.status === 401 || err.config?.url?.includes("/refresh"))
    )
      return null;
    throw err;
  }
}

export async function login(username: string, password: string) {
  await api.post("/api/auth/login", { username, password });
}

export async function register(
  username: string,
  email: string,
  password: string
) {
  const form = new FormData();
  form.append("Username", username);
  form.append("Email", email);
  form.append("Password", password);
  await api.post("/api/auth/register", form);
}

export async function logout() {
  await api.post("/api/auth/logout");
}
