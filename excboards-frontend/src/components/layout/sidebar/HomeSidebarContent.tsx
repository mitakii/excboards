import { RecentBoardsList } from "@/features/boards/components/RecentBoardsList";
import { RecentUsersList } from "@/features/profile/components/RecentUsersList";

export function HomeSidebarContent() {
  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-2">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Recently opened</h2>
        <RecentBoardsList />
      </section>
      <section className="space-y-2">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Recently visited</h2>
        <RecentUsersList />
      </section>
    </div>
  );
}
