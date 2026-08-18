import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api";
import { useCreateBoard, useUpdateBoard } from "../queries";
import { TagBadgeEditor } from "./TagBadgeEditor";

const EMPTY_SCENE = JSON.stringify({
  type: "excalidraw",
  version: 2,
  source: "excboards",
  elements: [],
  appState: {},
  files: {},
});

interface BoardFormDialogProps {
  trigger: React.ReactNode;
  board?: { id: string; name: string; description: string; tags: string[] };
}

export function BoardFormDialog({ trigger, board }: BoardFormDialogProps) {
  const isEdit = board != null;
  const navigate = useNavigate();
  const createBoard = useCreateBoard();
  const updateBoard = useUpdateBoard();
  const pending = isEdit ? updateBoard.isPending : createBoard.isPending;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(board?.name ?? "");
  const [description, setDescription] = useState(board?.description ?? "");
  const [tags, setTags] = useState<string[]>(board?.tags ?? []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(board?.name ?? "");
    setDescription(board?.description ?? "");
    setTags(board?.tags ?? []);
    setError(null);
  }, [open]);

  async function handleSubmit() {
    if (!name.trim()) return;

    setError(null);
    try {
      if (board) {
        await updateBoard.mutateAsync({
          id: board.id,
          name,
          description,
          tags,
        });
        setOpen(false);
      } else {
        // NOTE: tags aren't sent — CreateBoardRequest has no Tags field on the backend yet.
        const scene = new Blob([EMPTY_SCENE], { type: "application/json" });
        const boardId = await createBoard.mutateAsync({
          name,
          description,
          scene,
        });
        setOpen(false);
        navigate(`/boards/${boardId}`);
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          isEdit ? "Failed to save board." : "Failed to create board."
        )
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit board" : "Create board"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="board-form-name">Board name</FieldLabel>
            <Input
              id="board-form-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled board"
              maxLength={200}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="board-form-description">
              Description
            </FieldLabel>
            <Textarea
              id="board-form-description"
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
          <Button onClick={handleSubmit} disabled={!name.trim() || pending}>
            {pending && <Spinner />}
            {isEdit ? "Save changes" : "Create board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
