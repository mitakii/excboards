import { useState } from "react";
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
  // Keep the auth query: removing it detaches components still watching it, and they
  // only pick up a replacement on their next render. Everything else is per-user data.
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== AUTH_STATUS_KEY[0],
  });
}

export function useStatus() {
  return useQuery({
    queryKey: AUTH_STATUS_KEY,
    queryFn: authApi.fetchStatus,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Increments when the logged-in user changes (login, logout, switching accounts).
 * Used as a key to remount the current page so its per-user data refetches.
 * The first status check on page load doesn't count, so a normal load mounts once.
 */
export function useSessionGeneration() {
  const { data: user, isPending } = useStatus();
  const current = isPending ? null : (user?.userId ?? "anonymous");
  const [session, setSession] = useState({ id: current, generation: 0 });

  if (current !== null && current !== session.id) {
    setSession({
      id: current,
      generation: session.id === null ? session.generation : session.generation + 1,
    });
  }

  return session.generation;
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
      queryClient.setQueryData(AUTH_STATUS_KEY, null);
      resetSessionState(queryClient);
    },
  });
}
