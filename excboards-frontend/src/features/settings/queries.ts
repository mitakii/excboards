import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AUTH_STATUS_KEY } from "@/features/auth/queries";
import * as settingsApi from "./api";

/** Refresh the token (claims) and refetch everything that shows user info. */
function useSyncUser() {
  const queryClient = useQueryClient();
  return async (refreshClaims: boolean) => {
    if (refreshClaims) await settingsApi.refreshSession();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: AUTH_STATUS_KEY }),
      queryClient.invalidateQueries({ queryKey: ["users"] }),
    ]);
  };
}

export function useChangeUsername() {
  const syncUser = useSyncUser();
  return useMutation({
    mutationFn: ({ newUsername, password }: { newUsername: string; password: string }) =>
      settingsApi.changeUsername(newUsername, password),
    onSuccess: () => syncUser(true),
  });
}

export function useChangeEmail() {
  const syncUser = useSyncUser();
  return useMutation({
    mutationFn: ({ newEmail, password }: { newEmail: string; password: string }) =>
      settingsApi.changeEmail(newEmail, password),
    onSuccess: () => syncUser(true),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      settingsApi.changePassword(oldPassword, newPassword),
  });
}

export function useChangePfp() {
  const syncUser = useSyncUser();
  return useMutation({
    mutationFn: ({ picture, password }: { picture: File; password: string }) =>
      settingsApi.changePfp(picture, password),
    onSuccess: () => syncUser(false),
  });
}
