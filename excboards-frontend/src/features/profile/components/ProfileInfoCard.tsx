import { Link } from "react-router-dom";
import { SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile } from "../api";

export function ProfileInfoCard({
  profile,
  isOwnProfile = false,
}: {
  profile: UserProfile;
  isOwnProfile?: boolean;
}) {
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
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-foreground">{profile.username}</h1>
          <p className="text-sm text-muted-foreground">Joined {joined}</p>
        </div>
        {isOwnProfile && (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/settings">
              <SettingsIcon />
              Settings
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
