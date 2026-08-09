import { useState } from "react";
import { useParams } from "react-router-dom";
import { PagePagination } from "@/components/PagePagination";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { BoardList } from "@/features/boards/components/BoardList";
import type { BoardCardData } from "@/features/boards/components/BoardCard";
import { useUserBoards, useDeleteBoard } from "@/features/boards/queries";
import { useStatus } from "@/features/auth/queries";
import { useUserProfile } from "./queries";
import { ProfileInfoCard } from "./components/ProfileInfoCard";

const PAGE_SIZE = 6;

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [page, setPage] = useState(1);
  const { data: currentUser } = useStatus();
  const profile = useUserProfile(username);
  const boards = useUserBoards(profile.data?.id, page, PAGE_SIZE);
  const deleteBoard = useDeleteBoard();

  if (!username) return null;

  if (profile.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-destructive">
        {getErrorMessage(profile.error, "User not found.")}
      </div>
    );
  }

  const isOwnProfile = currentUser?.userId === profile.data.id;
  const items: BoardCardData[] = (boards.data ?? []).map((board) => ({
    id: board.id,
    name: board.name,
    description: board.description ?? "",
    tags: [],
    owner: { username: profile.data.username, pfpUrl: profile.data.profilePictureUrl },
    updatedAt: new Date(board.updated).toLocaleDateString(),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <ProfileInfoCard profile={profile.data} />

      <div className="min-w-0 flex-1 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Boards</h2>
        <BoardList
          boards={items}
          emptyMessage="No boards yet."
          onDelete={isOwnProfile ? (id) => deleteBoard.mutate(id) : undefined}
        />
        {items.length >= PAGE_SIZE && (
          <PagePagination page={page} onPageChange={setPage} pageLength={items.length} pageSize={PAGE_SIZE} />
        )}
      </div>
    </div>
  );
}
