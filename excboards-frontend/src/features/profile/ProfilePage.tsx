import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { addRecentUser } from "@/lib/recentUsers";
import { useStatus } from "@/features/auth/queries";
import { useUserProfile } from "./queries";
import { ProfileBoardTabs } from "./components/ProfileBoardTabs";
import { ProfileInfoCard } from "./components/ProfileInfoCard";

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: currentUser } = useStatus();
  const profile = useUserProfile(username);

  const isOwnProfile = currentUser?.userId === profile.data?.userId;

  useEffect(() => {
    if (profile.data && !isOwnProfile) addRecentUser(profile.data.username);
  }, [profile.data, isOwnProfile]);

  if (!username) return null;

  if (profile.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-destructive">
        {getErrorMessage(profile.error, "User not found.")}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <ProfileInfoCard profile={profile.data} isOwnProfile={isOwnProfile} />

      <div className="min-w-0">
        {/* keyed so paging resets when navigating between profiles (the route stays mounted) */}
        <ProfileBoardTabs
          key={profile.data.userId}
          userId={profile.data.userId}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </div>
  );
}
