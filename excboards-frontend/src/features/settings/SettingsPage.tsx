import { Spinner } from "@/components/ui/spinner";
import { useStatus } from "@/features/auth/queries";
import { useUserById } from "@/features/profile/queries";
import { EmailForm } from "./components/EmailForm";
import { PasswordForm } from "./components/PasswordForm";
import { ProfilePictureForm } from "./components/ProfilePictureForm";
import { UsernameForm } from "./components/UsernameForm";

export function SettingsPage() {
  const { data: user } = useStatus();
  const profile = useUserById(user?.userId);

  if (!user) return null;

  if (profile.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-foreground">Settings</h1>
      <ProfilePictureForm
        username={user.userName}
        currentUrl={profile.data?.profilePictureUrl || undefined}
      />
      <UsernameForm currentUsername={user.userName} />
      <EmailForm currentEmail={user.email} />
      <PasswordForm />
    </div>
  );
}
