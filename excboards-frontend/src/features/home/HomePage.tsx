import { useStatus } from "@/features/auth/queries";
import { HomeSearch } from "@/features/search/components/HomeSearch";
import { staggerDelay } from "@/lib/utils";
import { WorldBoardSection } from "@/features/worldBoard/components/WorldBoardSection";
import { LandingHero } from "./components/LandingHero";
import { HomeBoardTabs } from "./components/HomeBoardTabs";
import { LatestBoardsSection } from "./components/LatestBoardsSection";

const ENTRANCE_CLASS =
  "animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-400";

export function HomePage() {
  const { data: user, isLoading } = useStatus();

  if (isLoading) return null;

  if (!user) {
    return (
      <>
        <LandingHero />
        <div
          className={`mx-auto w-full max-w-6xl px-4 pb-12 ${ENTRANCE_CLASS}`}
          style={staggerDelay(3, 100)}
        >
          <WorldBoardSection />
        </div>
        <section
          className={`mx-auto w-full max-w-6xl space-y-3 px-4 pb-12 ${ENTRANCE_CLASS}`}
          style={staggerDelay(4, 100)}
        >
          <h2 className="text-lg font-semibold text-foreground">
            Latest boards
          </h2>
          <LatestBoardsSection />
        </section>
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <div className={ENTRANCE_CLASS} style={staggerDelay(0, 80)}>
        <HomeSearch className="mx-auto max-w-xl" />
      </div>
      <div className={ENTRANCE_CLASS} style={staggerDelay(1, 80)}>
        <WorldBoardSection />
      </div>
      <div className={ENTRANCE_CLASS} style={staggerDelay(2, 80)}>
        <HomeBoardTabs user={user} />
      </div>
    </div>
  );
}
