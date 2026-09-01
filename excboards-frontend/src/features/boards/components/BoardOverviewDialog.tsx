import { useState } from "react";
import {
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
import { useStatus } from "@/features/auth/queries";
import { getErrorMessage } from "@/lib/api";
import {
  useBoard,
  useBoardCollaborators,
  usePublishBoard,
  useRemoveCollaborator,
  useUpdateBoard,
} from "../queries";
import { AddCollaboratorsDialog } from "./AddCollaboratorsDialog";
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
      {/* ~1/3 of the viewport width, centered (the default Dialog position). */}
      <DialogContent className="max-h-[85vh] w-[92vw] overflow-y-auto sm:w-[34vw] sm:min-w-[420px] sm:max-w-none">
        {isOpen && <BoardOverviewContent boardId={boardId} />}
      </DialogContent>
    </Dialog>
  );
}

function BoardOverviewContent({ boardId }: { boardId: string }) {
  const board = useBoard(boardId);
  const { data: user } = useStatus();
  const collaboratorsQuery = useBoardCollaborators(boardId);
  const updateBoard = useUpdateBoard();
  const publishBoard = usePublishBoard();
  const removeCollaborator = useRemoveCollaborator(boardId);

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
        <DialogTitle>{data.name}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={data.isPublished ? "default" : "outline"}>
            {data.isPublished ? <GlobeIcon /> : <LockIcon />}
            {data.isPublished ? "Published" : "Private"}
          </Badge>
          {canEdit && !data.isPublished && (
            <Button
              size="xs"
              variant="outline"
              onClick={handlePublish}
              disabled={publishBoard.isPending}
            >
              {publishBoard.isPending && <Spinner />}
              Publish
            </Button>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {(data.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
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
                    <Avatar size="sm">
                      {collaborator.profilePictureUrl && (
                        <AvatarImage
                          src={collaborator.profilePictureUrl}
                          alt={collaborator.username}
                        />
                      )}
                      <AvatarFallback>
                        {(collaborator.username || "?")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-foreground">
                      {collaborator.username || "Unknown user"}
                    </span>
                    <Badge variant="secondary">{collaborator.permission}</Badge>
                    {canManageCollaborators && (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground"
                        disabled={
                          removeCollaborator.isPending &&
                          removeCollaborator.variables === collaborator.userId
                        }
                        onClick={() =>
                          removeCollaborator.mutate(collaborator.userId)
                        }
                        aria-label={`Remove ${collaborator.username}`}
                      >
                        <XIcon />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </section>
      </div>

      {canEdit && (
        <DialogFooter>
          <Button variant="outline" onClick={startEditing}>
            <PencilIcon />
            Edit board
          </Button>
        </DialogFooter>
      )}
    </>
  );
}
