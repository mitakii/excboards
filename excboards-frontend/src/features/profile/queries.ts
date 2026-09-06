import { useSyncExternalStore } from "react";
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { getRecentUsernames, subscribeRecentUsers } from "@/lib/recentUsers";
import * as profileApi from "./api";

export function useUserProfile(username: string | undefined) {
  return useQuery({
    queryKey: ["users", "username", username],
    queryFn: () => profileApi.getUserByUsername(username!),
    enabled: !!username,
  });
}

export function useUserById(id: string | undefined) {
  return useQuery({
    queryKey: ["users", "id", id],
    queryFn: () => profileApi.getUserById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/** Resolve many user ids at once (deduped); returns a map keyed by id. */
export function useUsersByIds(ids: string[]) {
  const unique = [...new Set(ids)];
  const results = useQueries({
    queries: unique.map((id) => ({
      queryKey: ["users", "id", id],
      queryFn: () => profileApi.getUserById(id),
      retry: false,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const byId: Record<string, profileApi.UserProfile> = {};
  unique.forEach((id, i) => {
    const data = results[i]?.data;
    if (data) byId[id] = data;
  });
  return byId;
}

export function useSearchUsers(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["users", "search", trimmed],
    queryFn: () => profileApi.searchUsers(trimmed),
    enabled: trimmed.length > 0,
    placeholderData: keepPreviousData,
  });
}

export function useRecentUsers() {
  const usernames = useSyncExternalStore(subscribeRecentUsers, getRecentUsernames);
  const results = useQueries({
    queries: usernames.map((username) => ({
      queryKey: ["users", "username", username],
      queryFn: () => profileApi.getUserByUsername(username),
      retry: false,
      staleTime: 60_000,
    })),
  });

  return usernames.map((_, i) => results[i]?.data).filter((user): user is profileApi.UserProfile => user != null);
}
