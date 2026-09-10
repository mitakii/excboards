import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  GlobeIcon,
  LockIcon,
  PencilIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useStatus } from "@/features/auth/queries";
import { useUserById } from "@/features/profile/queries";
import { getErrorMessage } from "@/lib/api";
import { PermissionLevel } from "../api";
import {
  useBoard,
  useBoardCollaborators,
  usePublishBoard,
  useRemoveCollaborator,
  useUpdateBoard,
  useUpdateCollaborator,
} from "../queries";
import { AddCollaboratorsDialog } from "./AddCollaboratorsDialog";
import { PERMISSION_NAME_TO_LEVEL, PermissionSelect } from "./PermissionSelect";
import { TagBadgeEditor } from "./TagBadgeEditor";

interface BoardOverviewDialogProps {
  boardId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BoardOverviewDialog({
  boardId,
  trigger,
  open,
  onOpenChange,
}: BoardOverviewDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] w-[640px] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-[calc(100vw-2rem)]">
        {isOpen && <BoardOverviewContent boardId={boardId} />}
      </DialogContent>
    </Dialog>
  );
}

function BoardOverviewContent({ boardId }: { boardId: string }) {
  const board = useBoard(boardId);
  const { data: user } = useStatus();
  const owner = useUserById(board.data?.ownerId);
  const collaboratorsQuery = useBoardCollaborators(boardId);
  const updateBoard = useUpdateBoard();
  const publishBoard = usePublishBoard();
  const removeCollaborator = useRemoveCollaborator(boardId);
  const updateCollaborator = useUpdateCollaborator(boardId);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (board.isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  if (board.isError || !board.data) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        {getErrorMessage(board.error, "Failed to load board.")}
      </p>
    );
  }

  const data = board.data;
  const collaborators = collaboratorsQuery.data ?? [];

  const isOwner = Boolean(
    user && user.userId.toLowerCase() === data.ownerId.toLowerCase()
  );
  const myCollaborator = collaborators.find(
    (c) => user && c.userId.toLowerCase() === user.userId.toLowerCase()
  );
  const canEdit =
    isOwner ||
    myCollaborator?.permission === "Editor" ||
    myCollaborator?.permission === "Admin";
  const canManageCollaborators =
    isOwner || myCollaborator?.permission === "Admin";

  function startEditing() {
    setName(data.name);
    setDescription(data.description ?? "");
    setTags((data.tags ?? []).map((tag) => tag.name));
    setError(null);
    setEditing(true);
  }

  function handlePublish() {
    setError(null);
    publishBoard.mutate(boardId, {
      onError: (err) =>
        setError(getErrorMessage(err, "Failed to publish board.")),
    });
  }

  async function handleSave() {
    if (!name.trim()) return;
    setError(null);
    try {
      await updateBoard.mutateAsync({
        id: boardId,
        name: name.trim(),
        description,
        tags,
      });
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save board."));
    }
  }

  if (editing) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Edit board</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="board-overview-name">Board name</FieldLabel>
            <Input
              id="board-overview-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled board"
              maxLength={200}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="board-overview-description">
              Description
            </FieldLabel>
            <Textarea
              id="board-overview-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              maxLength={1000}
              rows={3}
            />
          </Field>
          <Field>
            <FieldLabel>Tags</FieldLabel>
            <TagBadgeEditor tags={tags} onTagsChange={setTags} />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setEditing(false)}
            disabled={updateBoard.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || updateBoard.isPending}
          >
            {updateBoard.isPending && <Spinner />}
            Save changes
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="wrap-anywhere">{data.name}</DialogTitle>
      </DialogHeader>

      <div className="min-w-0 space-y-4">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          {owner.data ? (
            <DialogClose asChild>
              <Link
                to={`/${owner.data.username}`}
                className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-accent"
              >
                <Avatar size="sm">
                  {owner.data.profilePictureUrl && (
                    <AvatarImage
                      src={owner.data.profilePictureUrl}
                      alt={owner.data.username}
                    />
                  )}
                  <AvatarFallback>
                    {owner.data.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="wrap-anywhere text-foreground">
                  {owner.data.username}
                </span>
              </Link>
            </DialogClose>
          ) : (
            <span className="text-muted-foreground">
              {owner.isLoading ? "…" : "Unknown"}
            </span>
          )}
        </div>

        {(data.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="max-w-full wrap-anywhere"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {data.isPublished ? (
            <Badge variant="default">
              <GlobeIcon />
              Published
            </Badge>
          ) : canEdit ? (
            <ConfirmDialog
              title="Publish this board?"
              description="Anyone will be able to find and view it. Publishing can't be undone."
              confirmLabel="Publish"
              confirmVariant="default"
              onConfirm={handlePublish}
              trigger={
                <button
                  type="button"
                  disabled={publishBoard.isPending}
                  aria-label="Publish board"
                  className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer gap-1 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {publishBoard.isPending ? <Spinner /> : <LockIcon />}
                    Private
                    <span className="text-muted-foreground">· Publish</span>
                  </Badge>
                </button>
              }
            />
          ) : (
            <Badge variant="outline">
              <LockIcon />
              Private
            </Badge>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <p className="text-sm whitespace-pre-wrap wrap-anywhere text-muted-foreground">
          {data.description?.trim() || "No description."}
        </p>

        <Separator />

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Collaborators
            </h3>
            {canManageCollaborators && (
              <AddCollaboratorsDialog
                boardId={boardId}
                trigger={
                  <Button size="xs" variant="outline">
                    <UserPlusIcon />
                    Add
                  </Button>
                }
              />
            )}
          </div>

          {collaboratorsQuery.isLoading ? (
            <div className="flex justify-center py-2 text-muted-foreground">
              <Spinner />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No collaborators yet.
            </p>
          ) : (
            <ScrollArea className="max-h-48">
              <div className="space-y-1 pr-3">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.userId}
                    className="flex items-center gap-2 py-1 text-sm"
                  >
                    {collaborator.username ? (
                      <DialogClose asChild>
                        <Link
                          to={`/${collaborator.username}`}
                          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 hover:bg-accent"
                        >
                          <Avatar size="sm">
                            {collaborator.profilePictureUrl && (
                              <AvatarImage
                                src={collaborator.profilePictureUrl}
                                alt={collaborator.username}
                              />
                            )}
                            <AvatarFallback>
                              {collaborator.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-foreground">
                            {collaborator.username}
                          </span>
                        </Link>
                      </DialogClose>
                    ) : (
                      <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
                        <Avatar size="sm">
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-muted-foreground">
                          Unknown user
                        </span>
                      </div>
                    )}
                    {canManageCollaborators ? (
                      <PermissionSelect
                        aria-label={`Permission for ${collaborator.username}`}
                        className="shrink-0"
                        value={
                          PERMISSION_NAME_TO_LEVEL[collaborator.permission] ??
                          PermissionLevel.Viewer
                        }
                        disabled={
                          updateCollaborator.isPending &&
                          updateCollaborator.variables?.userId ===
                            collaborator.userId
                        }
                        onChange={(permission) =>
                          updateCollaborator.mutate({
                            userId: collaborator.userId,
                            permission,
                          })
                        }
                      />
                    ) : (
                      <Badge variant="secondary">
                        {collaborator.permission}
                      </Badge>
                    )}
                    {canManageCollaborators && (
                      <ConfirmDialog
                        title="Remove collaborator?"
                        description={`${
                          collaborator.username || "This user"
                        } will lose access to this board.`}
                        confirmLabel="Remove"
                        onConfirm={() =>
                          removeCollaborator.mutate(collaborator.userId)
                        }
                        trigger={
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="shrink-0 text-muted-foreground"
                            disabled={
                              removeCollaborator.isPending &&
                              removeCollaborator.variables ===
                                collaborator.userId
                            }
                            aria-label={`Remove ${collaborator.username}`}
                          >
                            <XIcon />
                          </Button>
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </section>
      </div>

      <DialogFooter className="flex-col gap-2 sm:flex-col">
        {canEdit && (
          <Button
            variant="outline"
            onClick={startEditing}
            className="w-full sm:w-auto sm:self-end"
          >
            <PencilIcon />
            Edit board
          </Button>
        )}
        <Button asChild size="lg" className="h-11 w-full text-base">
          <Link to={`/boards/${boardId}`}>
            Open board
            <ArrowRightIcon />
          </Link>
        </Button>
      </DialogFooter>
    </>
  );
}
