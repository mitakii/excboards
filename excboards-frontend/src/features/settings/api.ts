import { api } from "@/lib/api";

export async function changeUsername(newUsername: string, password: string) {
  await api.post("/api/User/settings/changeUsername", { newUsername, password });
}

export async function changeEmail(newEmail: string, password: string) {
  await api.post("/api/User/settings/changeEmail", { newEmail, password });
}

export async function changePassword(oldPassword: string, newPassword: string) {
  await api.post("/api/User/settings/changePassword", {
    oldPassword,
    newPassword,
  });
}

export async function changePfp(picture: File, password: string) {
  const form = new FormData();
  form.append("Picture", picture);
  form.append("Password", password);
  await api.post("/api/User/settings/changePfp", form);
}

/** Username/email live in the JWT claims; rotating the tokens re-reads them
 * from the database so /auth/status reflects the change. */
export async function refreshSession() {
  await api.post("/api/auth/refresh");
}
