import { Link, useNavigate } from "react-router-dom";
import { LogOutIcon, PenSquareIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLogout, useStatus } from "@/features/auth/queries";
import { BoardFormDialog } from "@/features/boards/components/BoardFormDialog";

export function Navbar({
  showSidebarTrigger = true,
}: {
  showSidebarTrigger?: boolean;
}) {
  const { data: user } = useStatus();
  const logout = useLogout();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout.mutateAsync();
    navigate("/");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex items-center gap-4 px-4 py-3">
        {showSidebarTrigger && <SidebarTrigger />}

        <Link
          to="/"
          className="shrink-0 text-base font-semibold text-foreground"
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
                  <button type="button" aria-label="Account menu">
                    <Avatar>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    <LogOutIcon />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
