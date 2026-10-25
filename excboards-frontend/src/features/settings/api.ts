import { api } from "@/lib/api";

export interface AccountSettings {
  hasPassword: boolean;
}

export async function fetchSettings() {
  const res = await api.get<AccountSettings>("/api/User/settings");
  return res.data;
}

export async function changeUsername(newUsername: string) {
  await api.post("/api/User/settings/changeUsername", { newUsername });
}

export async function changeEmail(newEmail: string) {
  await api.post("/api/User/settings/changeEmail", { newEmail });
}

export async function changePassword(oldPassword: string, newPassword: string) {
  await api.post("/api/User/settings/changePassword", {
    oldPassword,
    newPassword,
  });
}

/** For accounts created through Google, which have no password yet. */
export async function setPassword(newPassword: string) {
  await api.post("/api/User/settings/setPassword", { newPassword });
}

export async function changePfp(picture: File) {
  const form = new FormData();
  form.append("Picture", picture);
  await api.post("/api/User/settings/changePfp", form);
}

/** Username/email live in the JWT claims; rotating the tokens re-reads them
 * from the database so /auth/status reflects the change. */
export async function refreshSession() {
  await api.post("/api/auth/refresh");
}
