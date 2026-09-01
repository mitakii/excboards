import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile } from "../api";

export function ProfileInfoCard({ profile }: { profile: UserProfile }) {
  const joined = new Date(profile.createdAtUtc).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <Avatar size="lg" className="size-16 shrink-0">
          {profile.profilePictureUrl && <AvatarImage src={profile.profilePictureUrl} />}
          <AvatarFallback className="text-xl">
            {profile.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-foreground">{profile.username}</h1>
          <p className="text-sm text-muted-foreground">Joined {joined}</p>
        </div>
      </CardContent>
    </Card>
  );
}
