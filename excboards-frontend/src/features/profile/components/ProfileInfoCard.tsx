import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile } from "../api";

export function ProfileInfoCard({ profile }: { profile: UserProfile }) {
  const joined = new Date(profile.createdAtUtc).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <Card className="lg:w-72 lg:shrink-0">
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <Avatar size="lg" className="size-24">
          {profile.profilePictureUrl && <AvatarImage src={profile.profilePictureUrl} />}
          <AvatarFallback className="text-2xl">
            {profile.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-lg font-semibold text-foreground">{profile.username}</h1>
        <p className="text-sm text-muted-foreground">Joined {joined}</p>
      </CardContent>
    </Card>
  );
}
