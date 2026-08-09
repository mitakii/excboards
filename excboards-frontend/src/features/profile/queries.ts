import { useQuery } from "@tanstack/react-query";
import * as profileApi from "./api";

export function useUserProfile(username: string | undefined) {
  return useQuery({
    queryKey: ["users", "username", username],
    queryFn: () => profileApi.getUserByUsername(username!),
    enabled: !!username,
  });
}
