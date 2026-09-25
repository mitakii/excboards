import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LogOutIcon,
  MoonIcon,
  PenSquareIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTheme } from "@/components/theme-provider";
import { getErrorMessage } from "@/lib/api";
import { useLogout, useStatus } from "@/features/auth/queries";
import { BoardFormDialog } from "@/features/boards/components/BoardFormDialog";
import { useUserById } from "@/features/profile/queries";

export function Navbar({
  showSidebarTrigger = true,
}: {
  showSidebarTrigger?: boolean;
}) {
  const { data: user } = useStatus();
  // /auth/status carries no picture URL; the user record does.
  const { data: profile } = useUserById(user?.userId);
  const logout = useLogout();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout.mutateAsync();
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't log out."));
      throw err;
    }
    navigate("/");
  }

  function handleToggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex items-center gap-4 px-4 py-3">
        {showSidebarTrigger && <SidebarTrigger />}

        <Link
          to="/"
          className="shrink-0 text-base font-semibold text-foreground transition-opacity hover:opacity-70"
        >
          excboards
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <BoardFormDialog
                trigger={
                  <Button size="sm">
                    <PenSquareIcon />
                    New board
                  </Button>
                }
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Account menu"
                    className="transition-transform hover:scale-105 active:scale-95"
                  >
                    <Avatar>
                      {profile?.profilePictureUrl && (
                        <AvatarImage src={profile.profilePictureUrl} />
                      )}
                      <AvatarFallback>
                        {user.userName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.userName}</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => navigate(`/${user.userName}`)}
                  >
                    <UserIcon />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <SettingsIcon />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleTheme}>
                    {resolvedTheme === "dark" ? (
                      <>
                        <SunIcon />
                        Light mode
                      </>
                    ) : (
                      <>
                        <MoonIcon />
                        Dark mode
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setConfirmLogoutOpen(true)}
                  >
                    <LogOutIcon />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ConfirmDialog
                open={confirmLogoutOpen}
                onOpenChange={setConfirmLogoutOpen}
                size="sm"
                icon={<LogOutIcon />}
                title="Log out?"
                description="You'll need to sign in again to edit your boards."
                confirmLabel="Log out"
                onConfirm={handleLogout}
              >
                <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-muted/40 p-2.5">
                  <Avatar>
                    {profile?.profilePictureUrl && (
                      <AvatarImage src={profile.profilePictureUrl} />
                    )}
                    <AvatarFallback>
                      {user.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.userName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </ConfirmDialog>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Sign in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
