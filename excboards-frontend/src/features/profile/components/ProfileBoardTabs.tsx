import { useSearchParams } from "react-router-dom";
import {
  BookmarkIcon,
  HeartIcon,
  LayoutGridIcon,
  UsersIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadMoreBoardList } from "@/features/boards/components/LoadMoreBoardList";
import {
  useUserBoards,
  useUserContributedBoards,
  useUserLikedBoards,
} from "@/features/boards/queries";
import { BookmarkedBoardsSection } from "@/features/home/components/BookmarkedBoardsSection";

const PAGE_SIZE = 9;
const TABS = ["boards", "contributed", "liked", "bookmarks"] as const;
type ProfileTab = (typeof TABS)[number];

function OwnedBoardsTab({ userId }: { userId: string }) {
  const boards = useUserBoards(userId, PAGE_SIZE);
  return <LoadMoreBoardList query={boards} emptyMessage="No boards yet." />;
}

function ContributedBoardsTab({ userId }: { userId: string }) {
  const boards = useUserContributedBoards(userId, PAGE_SIZE);
  return (
    <LoadMoreBoardList
      query={boards}
      emptyMessage="Hasn't contributed to any boards yet."
    />
  );
}

function LikedBoardsTab({ userId }: { userId: string }) {
  const boards = useUserLikedBoards(userId, PAGE_SIZE);
  return <LoadMoreBoardList query={boards} emptyMessage="No liked boards yet." />;
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
        <OwnedBoardsTab userId={userId} />
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
