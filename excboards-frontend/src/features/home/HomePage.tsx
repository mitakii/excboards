import { useStatus } from "@/features/auth/queries";
import { HomeSearch } from "@/features/search/components/HomeSearch";
import { staggerDelay } from "@/lib/utils";
import { LandingHero } from "./components/LandingHero";
import { RecommendedByTagSection } from "./components/RecommendedByTagSection";
import { RecentlyViewedSection } from "./components/RecentlyViewedSection";
import { YourBoardsSection } from "./components/YourBoardsSection";

const ENTRANCE_CLASS =
  "animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-400";

export function HomePage() {
  const { data: user, isLoading } = useStatus();

  if (isLoading) return null;

  if (!user) return <LandingHero />;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <div className={ENTRANCE_CLASS} style={staggerDelay(0, 80)}>
        <HomeSearch className="mx-auto max-w-xl" />
      </div>
      <div className={ENTRANCE_CLASS} style={staggerDelay(1, 80)}>
        <YourBoardsSection user={user} />
      </div>
      <div className={ENTRANCE_CLASS} style={staggerDelay(2, 80)}>
        <RecentlyViewedSection />
      </div>
      <div className={ENTRANCE_CLASS} style={staggerDelay(3, 80)}>
        <RecommendedByTagSection />
      </div>
    </div>
  );
}
