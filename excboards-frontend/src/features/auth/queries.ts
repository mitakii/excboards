import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "./api";

export const AUTH_STATUS_KEY = ["auth", "status"];

export function useStatus() {
  return useQuery({
    queryKey: AUTH_STATUS_KEY,
    queryFn: authApi.fetchStatus,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTH_STATUS_KEY }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({
      username,
      email,
      password,
    }: {
      username: string;
      email: string;
      password: string;
    }) => authApi.register(username, email, password),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_STATUS_KEY, null);
      queryClient.invalidateQueries({ queryKey: AUTH_STATUS_KEY });
    },
  });
}
