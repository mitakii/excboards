import { BoardList } from "@/features/boards/components/BoardList";
import type { BoardCardData } from "@/features/boards/components/BoardCard";
import { useRecentBoards } from "@/features/boards/queries";
import { useUsersByIds } from "@/features/profile/queries";

export function RecentlyViewedSection() {
  const recentBoards = useRecentBoards();
  const owners = useUsersByIds(recentBoards.map((board) => board.ownerId));

  const items: BoardCardData[] = recentBoards.map((board) => {
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
      isBookmarked: board.isBookmarked,
      likesCount: board.likesCount,
      isLiked: board.isLiked,
    };
  });

  return (
    <section className="space-y-3">
      <BoardList
        boards={items}
        emptyMessage="Boards you open will show up here."
      />
    </section>
  );
}
