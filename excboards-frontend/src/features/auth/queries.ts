import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { clearRecentBoards } from "@/lib/recentBoards";
import { clearRecentUsers } from "@/lib/recentUsers";
import * as authApi from "./api";

export const AUTH_STATUS_KEY = ["auth", "status"];

function resetSessionState(queryClient: QueryClient) {
  clearRecentBoards();
  clearRecentUsers();
  queryClient.removeQueries();
}

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
    mutationFn: ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => authApi.login(username, password),
    onSuccess: () => {
      resetSessionState(queryClient);
      queryClient.invalidateQueries({ queryKey: AUTH_STATUS_KEY });
    },
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
      resetSessionState(queryClient);
      queryClient.setQueryData(AUTH_STATUS_KEY, null);
    },
  });
}
