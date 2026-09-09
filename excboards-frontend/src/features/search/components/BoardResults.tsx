import { BoardList } from "@/features/boards/components/BoardList";
import type { BoardCardData } from "@/features/boards/components/BoardCard";
import { useUsersByIds } from "@/features/profile/queries";
import type { BoardSearchResult } from "../api";

/** Renders board search hits as the shared board list, resolving owner names. */
export function BoardResults({ boards }: { boards: BoardSearchResult[] }) {
  const owners = useUsersByIds(boards.map((board) => board.ownerId));

  const items: BoardCardData[] = boards.map((board) => {
    const owner = owners[board.ownerId];
    return {
      id: board.id,
      name: board.name,
      description: board.description ?? "",
      tags: board.tags.map((tag) => tag.name),
      owner: owner
        ? { username: owner.username, pfpUrl: owner.profilePictureUrl }
        : undefined,
      updatedAt: new Date(board.updated).toLocaleDateString(),
      isPublished: board.isPublished,
    };
  });

  return (
    <BoardList
      boards={items}
      layout="list"
      emptyMessage="No boards match your search."
    />
  );
}
