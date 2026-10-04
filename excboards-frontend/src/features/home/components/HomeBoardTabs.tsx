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

const TABS = ["yours", "latest", "recent", "bookmarked"] as const;
type HomeTab = (typeof TABS)[number];

const STORAGE_KEY = "home.boardTab";

function readStoredTab(): HomeTab {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return TABS.includes(stored as HomeTab) ? (stored as HomeTab) : "yours";
  } catch {
    return "yours";
  }
}

export function HomeBoardTabs({ user }: { user: AuthUser }) {
  const [tab, setTab] = useState<HomeTab>(readStoredTab);

  const changeTab = (value: string) => {
    setTab(value as HomeTab);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // storage unavailable (private mode etc.), tab just won't be remembered
    }
  };

  return (
    <Tabs value={tab} onValueChange={changeTab}>
      <TabsList aria-label="Boards">
        <TabsTrigger value="yours">
          <LayoutGridIcon />
          Your boards
        </TabsTrigger>
        <TabsTrigger value="latest">
          <SparklesIcon />
          Latest
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
      <TabsContent value="yours">
        <YourBoardsSection user={user} />
      </TabsContent>
      <TabsContent value="latest">
        <LatestBoardsSection />
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
