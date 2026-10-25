import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AUTH_STATUS_KEY } from "@/features/auth/queries";
import * as settingsApi from "./api";

const SETTINGS_KEY = ["settings"] as const;

export function useAccountSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: settingsApi.fetchSettings,
  });
}

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
    mutationFn: ({ newUsername }: { newUsername: string }) =>
      settingsApi.changeUsername(newUsername),
    onSuccess: () => syncUser(true),
  });
}

export function useChangeEmail() {
  const syncUser = useSyncUser();
  return useMutation({
    mutationFn: ({ newEmail }: { newEmail: string }) => settingsApi.changeEmail(newEmail),
    onSuccess: () => syncUser(true),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      settingsApi.changePassword(oldPassword, newPassword),
  });
}

export function useSetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ newPassword }: { newPassword: string }) =>
      settingsApi.setPassword(newPassword),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}

export function useChangePfp() {
  const syncUser = useSyncUser();
  return useMutation({
    mutationFn: ({ picture }: { picture: File }) => settingsApi.changePfp(picture),
    onSuccess: () => syncUser(false),
  });
}
