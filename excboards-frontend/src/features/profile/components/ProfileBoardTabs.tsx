import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BookmarkIcon,
  HeartIcon,
  LayoutGridIcon,
  UsersIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PagedBoardList } from "@/features/boards/components/PagedBoardList";
import {
  useDeleteBoard,
  useUserBoards,
  useUserContributedBoards,
  useUserLikedBoards,
} from "@/features/boards/queries";
import { BookmarkedBoardsSection } from "@/features/home/components/BookmarkedBoardsSection";

const PAGE_SIZE = 9;
const TABS = ["boards", "contributed", "liked", "bookmarks"] as const;
type ProfileTab = (typeof TABS)[number];

function OwnedBoardsTab({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
  const [page, setPage] = useState(1);
  const boards = useUserBoards(userId, page, PAGE_SIZE);
  const deleteBoard = useDeleteBoard();
  return (
    <PagedBoardList
      query={boards}
      page={page}
      onPageChange={setPage}
      pageSize={PAGE_SIZE}
      emptyMessage="No boards yet."
      onDelete={isOwnProfile ? (id) => deleteBoard.mutateAsync(id) : undefined}
    />
  );
}

function ContributedBoardsTab({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const boards = useUserContributedBoards(userId, page, PAGE_SIZE);
  return (
    <PagedBoardList
      query={boards}
      page={page}
      onPageChange={setPage}
      pageSize={PAGE_SIZE}
      emptyMessage="Hasn't contributed to any boards yet."
    />
  );
}

function LikedBoardsTab({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const boards = useUserLikedBoards(userId, page, PAGE_SIZE);
  return (
    <PagedBoardList
      query={boards}
      page={page}
      onPageChange={setPage}
      pageSize={PAGE_SIZE}
      emptyMessage="No liked boards yet."
    />
  );
}

export function ProfileBoardTabs({
  userId,
  isOwnProfile,
}: {
  userId: string;
  isOwnProfile: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab") as ProfileTab | null;
  // ?tab= keeps profile links pointing at a tab; bookmarks are private to the owner
  const tab: ProfileTab =
    requested && TABS.includes(requested) && (requested !== "bookmarks" || isOwnProfile)
      ? requested
      : "boards";

  const changeTab = (value: string) =>
    setSearchParams(
      (params) => {
        if (value === "boards") params.delete("tab");
        else params.set("tab", value);
        return params;
      },
      { replace: true }
    );

  return (
    <Tabs value={tab} onValueChange={changeTab}>
      <TabsList aria-label="Profile boards">
        <TabsTrigger value="boards">
          <LayoutGridIcon />
          Boards
        </TabsTrigger>
        <TabsTrigger value="contributed">
          <UsersIcon />
          Contributed
        </TabsTrigger>
        <TabsTrigger value="liked">
          <HeartIcon />
          Liked
        </TabsTrigger>
        {isOwnProfile && (
          <TabsTrigger value="bookmarks">
            <BookmarkIcon />
            Bookmarks
          </TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="boards">
        <OwnedBoardsTab userId={userId} isOwnProfile={isOwnProfile} />
      </TabsContent>
      <TabsContent value="contributed">
        <ContributedBoardsTab userId={userId} />
      </TabsContent>
      <TabsContent value="liked">
        <LikedBoardsTab userId={userId} />
      </TabsContent>
      {isOwnProfile && (
        <TabsContent value="bookmarks">
          <BookmarkedBoardsSection />
        </TabsContent>
      )}
    </Tabs>
  );
}
