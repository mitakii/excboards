import { useEffect, useState } from "react";
import { CheckIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useStatus } from "@/features/auth/queries";
import { useSearchUsers } from "@/features/profile/queries";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { PermissionLevel } from "../api";
import {
  useAddCollaborator,
  useBoard,
  useBoardCollaborators,
} from "../queries";

type GrantableLevel = {
  value: number;
  label: string;
  hint: string;
};

const LEVELS: GrantableLevel[] = [
  { value: PermissionLevel.Viewer, label: "Viewer", hint: "Can view the board" },
  { value: PermissionLevel.Editor, label: "Editor", hint: "Can view and edit" },
  {
    value: PermissionLevel.Admin,
    label: "Admin",
    hint: "Can edit and manage collaborators",
  },
];

interface AddCollaboratorsDialogProps {
  boardId: string;
  trigger: React.ReactNode;
}

export function AddCollaboratorsDialog({
  boardId,
  trigger,
}: AddCollaboratorsDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: currentUser } = useStatus();
  const board = useBoard(boardId);
  const collaborators = useBoardCollaborators(boardId);
  const search = useSearchUsers(debouncedQuery);
  const addCollaborator = useAddCollaborator(boardId);

  const [error, setError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [permission, setPermission] = useState<number>(PermissionLevel.Editor);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setError(null);
      setPendingUserId(null);
      setPermission(PermissionLevel.Editor);
    }
  }, [open]);

  const isOwner = Boolean(
    currentUser &&
      board.data &&
      currentUser.userId.toLowerCase() === board.data.ownerId.toLowerCase(),
  );
  const myPermission = (collaborators.data ?? []).find(
    (c) => currentUser && c.userId.toLowerCase() === currentUser.userId.toLowerCase(),
  )?.permission;
  const isAdmin = isOwner || myPermission === "Admin";

  // "view" / "edit" are grantable by an admin; "admin" by the owner or another
  // admin. (Transferring ownership isn't supported by the API yet.)
  const grantableLevels = LEVELS.filter(
    (level) => level.value !== PermissionLevel.Admin || isAdmin,
  );

  const collaboratorIds = new Set(
    (collaborators.data ?? []).map((c) => c.userId)
  );

  const results = (search.data?.result ?? []).filter(
    (user) => user.userId !== currentUser?.userId
  );

  async function handleAdd(userId: string) {
    setError(null);
    setPendingUserId(userId);
    try {
      await addCollaborator.mutateAsync({ userId, permission });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add collaborator."));
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add users</DialogTitle>
          <DialogDescription>
            Search for a user and add them as a collaborator on this board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username"
              className="pl-9"
              autoFocus
            />
          </div>

          <Field>
            <FieldLabel htmlFor="add-collaborator-permission">
              Permission
            </FieldLabel>
            <select
              id="add-collaborator-permission"
              value={permission}
              onChange={(e) => setPermission(Number(e.target.value))}
              className={cn(
                "h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "dark:bg-input/30",
              )}
            >
              {grantableLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label} — {level.hint}
                </option>
              ))}
            </select>
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <ScrollArea className="h-64">
            <div className="space-y-1 pr-3">
              {debouncedQuery.trim().length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                  Start typing to find users.
                </p>
              ) : search.isLoading ? (
                <div className="flex justify-center py-6 text-muted-foreground">
                  <Spinner />
                </div>
              ) : search.isError ? (
                <p className="px-1 py-6 text-center text-sm text-destructive">
                  {getErrorMessage(search.error, "Search failed.")}
                </p>
              ) : results.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                  No users found.
                </p>
              ) : (
                results.map((user) => {
                  const alreadyAdded = collaboratorIds.has(user.userId);
                  return (
                    <div
                      key={user.userId}
                      className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-accent"
                    >
                      <Avatar size="sm">
                        {user.profilePictureUrl && (
                          <AvatarImage
                            src={user.profilePictureUrl}
                            alt={user.username}
                          />
                        )}
                        <AvatarFallback>
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-foreground">
                        {user.username}
                      </span>
                      <Button
                        size="icon-sm"
                        variant={alreadyAdded ? "ghost" : "outline"}
                        className="shrink-0"
                        disabled={alreadyAdded || pendingUserId === user.userId}
                        onClick={() => handleAdd(user.userId)}
                        aria-label={
                          alreadyAdded
                            ? `${user.username} is already a collaborator`
                            : `Add ${user.username}`
                        }
                      >
                        {pendingUserId === user.userId ? (
                          <Spinner />
                        ) : alreadyAdded ? (
                          <CheckIcon />
                        ) : (
                          <PlusIcon />
                        )}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
