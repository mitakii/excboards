import { useState } from "react";
import {
  BookmarkIcon,
  HistoryIcon,
  LayoutGridIcon,
  SparklesIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AuthUser } from "@/features/auth/api";
import { BookmarkedBoardsSection } from "./BookmarkedBoardsSection";
import { LatestBoardsSection } from "./LatestBoardsSection";
import { RecentlyViewedSection } from "./RecentlyViewedSection";
import { YourBoardsSection } from "./YourBoardsSection";

export function HomeBoardTabs({ user }: { user: AuthUser }) {
  // always opens on Latest; switching tabs isn't remembered across visits
  const [tab, setTab] = useState("latest");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList aria-label="Boards">
        <TabsTrigger value="latest">
          <SparklesIcon />
          Latest
        </TabsTrigger>
        <TabsTrigger value="yours">
          <LayoutGridIcon />
          Your boards
        </TabsTrigger>
        <TabsTrigger value="recent">
          <HistoryIcon />
          Recently viewed
        </TabsTrigger>
        <TabsTrigger value="bookmarked">
          <BookmarkIcon />
          Bookmarked
        </TabsTrigger>
      </TabsList>
      <TabsContent value="latest">
        <LatestBoardsSection />
      </TabsContent>
      <TabsContent value="yours">
        <YourBoardsSection user={user} />
      </TabsContent>
      <TabsContent value="recent">
        <RecentlyViewedSection />
      </TabsContent>
      <TabsContent value="bookmarked">
        <BookmarkedBoardsSection />
      </TabsContent>
    </Tabs>
  );
}
