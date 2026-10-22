import { isAxiosError } from "axios";
import { api } from "@/lib/api";

export interface AuthUser {
  userId: string;
  userName: string;
  email: string;
}

export async function fetchStatus(): Promise<AuthUser | null> {
  try {
    const res = await api.get<AuthUser>("/api/auth/status");
    return res.data;
  } catch (err) {
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

/** Mirrors backend Contracts.Auth.GoogleLoginResponse. */
export type GoogleLoginResponse =
  | { needsUsername: false; user: AuthUser }
  | { needsUsername: true; suggestedUsername: string };

export async function loginWithGoogle(idToken: string) {
  const res = await api.post<GoogleLoginResponse>("/api/auth/google", {
    idToken,
  });
  return res.data;
}

export async function registerWithGoogle(idToken: string, username: string) {
  await api.post("/api/auth/google/register", { idToken, username });
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
