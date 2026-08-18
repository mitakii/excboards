import { api } from "@/lib/api";

export interface AuthUser {
  userId: string;
  userName: string;
  email: string;
}

export async function fetchStatus() {
  const res = await api.get<AuthUser>("/api/auth/status");
  return res.data;
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
