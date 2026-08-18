import { Link, useNavigate } from "react-router-dom";
import { LogOutIcon, PanelLeftIcon, PenSquareIcon, UserIcon } from "lucide-react";
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
import { useLogout, useStatus } from "@/features/auth/queries";
import { BoardFormDialog } from "@/features/boards/components/BoardFormDialog";
import { SearchBar } from "./SearchBar";

export function Navbar({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  const { data: user } = useStatus();
  const logout = useLogout();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout.mutateAsync();
    navigate("/");
  }

  function handleSearch(query: string) {
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <PanelLeftIcon />
        </Button>

        <Link
          to="/"
          className="shrink-0 text-base font-semibold text-foreground"
        >
          excboards
        </Link>

        <SearchBar onSearch={handleSearch} className="max-w-md" />

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
