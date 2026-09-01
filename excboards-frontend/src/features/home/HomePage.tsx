import { useNavigate } from "react-router-dom";
import { useStatus } from "@/features/auth/queries";
import { SearchBar } from "@/components/layout/SearchBar";
import { LandingHero } from "./components/LandingHero";
import { RecommendedByTagSection } from "./components/RecommendedByTagSection";
import { RecentlyViewedSection } from "./components/RecentlyViewedSection";
import { YourBoardsSection } from "./components/YourBoardsSection";

export function HomePage() {
  const { data: user, isLoading } = useStatus();
  const navigate = useNavigate();

  if (isLoading) return null;

  if (!user) return <LandingHero />;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <SearchBar
        onSearch={(query) => {
          if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
        }}
        className="mx-auto w-1/2"
      />
      <YourBoardsSection user={user} />
      <RecentlyViewedSection />
      <RecommendedByTagSection />
    </div>
  );
}
