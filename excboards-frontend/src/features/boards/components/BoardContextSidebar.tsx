import { ChevronDownIcon, PencilIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useStatus } from "@/features/auth/queries";
import { getBoardCollaborators } from "@/lib/mockData";
import { useBoard } from "../queries";
import { BoardFormDialog } from "./BoardFormDialog";
import { RecentBoardsList } from "./RecentBoardsList";

export function BoardContextSidebar({ boardId }: { boardId: string }) {
  const board = useBoard(boardId);
  const { data: user } = useStatus();

  // TODO(backend): BoardResponse doesnt expose Owner/Permission
  const canEdit = Boolean(user);
  const collaborators = getBoardCollaborators(boardId);

  if (board.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8 text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  if (!board.data) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-base font-semibold text-foreground">
          {board.data.name}
        </h1>
        {board.data.description && (
          <p className="text-sm text-muted-foreground">
            {board.data.description}
          </p>
        )}
      </div>

      {canEdit && (
        <BoardFormDialog
          board={{
            id: board.data.id,
            name: board.data.name,
            description: board.data.description ?? "",
            tags: [],
          }}
          trigger={
            <Button size="sm" variant="outline">
              <PencilIcon />
              Edit
            </Button>
          }
        />
      )}

      <Separator />

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="group flex w-full items-center justify-between text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Collaborators
          <ChevronDownIcon className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-1">
          {collaborators.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No collaborators yet.
            </p>
          ) : (
            collaborators.map((collaborator) => (
              <div
                key={collaborator.userId}
                className="flex items-center gap-2 px-1 py-1 text-sm"
              >
                <Avatar size="sm">
                  <AvatarFallback>
                    {collaborator.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-foreground">
                  {collaborator.username}
                </span>
                <Badge variant="secondary">{collaborator.permission}</Badge>
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      <section className="space-y-2">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Recently opened
        </h2>
        <RecentBoardsList />
      </section>
    </div>
  );
}
