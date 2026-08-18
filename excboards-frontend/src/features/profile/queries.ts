import { useQueries, useQuery } from "@tanstack/react-query";
import { getRecentUsernames } from "@/lib/recentUsers";
import * as profileApi from "./api";

export function useUserProfile(username: string | undefined) {
  return useQuery({
    queryKey: ["users", "username", username],
    queryFn: () => profileApi.getUserByUsername(username!),
    enabled: !!username,
  });
}

export function useRecentUsers() {
  const usernames = getRecentUsernames();
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
