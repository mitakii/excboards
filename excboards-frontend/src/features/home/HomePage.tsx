import { useStatus } from "@/features/auth/queries";
import { LandingHero } from "./components/LandingHero";
import { RecommendedByTagSection } from "./components/RecommendedByTagSection";
import { RecentlyViewedSection } from "./components/RecentlyViewedSection";
import { YourBoardsSection } from "./components/YourBoardsSection";

export function HomePage() {
  const { data: user, isLoading } = useStatus();

  if (isLoading) return null;

  if (!user) return <LandingHero />;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <YourBoardsSection user={user} />
      <RecentlyViewedSection />
      <RecommendedByTagSection />
    </div>
  );
}
