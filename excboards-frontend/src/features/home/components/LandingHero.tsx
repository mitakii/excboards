import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { staggerDelay } from "@/lib/utils";

export function LandingHero() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1
        className="max-w-2xl animate-in fade-in-0 slide-in-from-bottom-4 text-4xl font-semibold text-foreground duration-500 fill-mode-backwards"
        style={staggerDelay(0, 100)}
      >
        Sketch, diagram, and share boards with your team
      </h1>
      <p
        className="max-w-lg animate-in fade-in-0 slide-in-from-bottom-4 text-muted-foreground duration-500 fill-mode-backwards"
        style={staggerDelay(1, 100)}
      >
        excboards combines a drawing canvas with a blog-style layer for browsing and publishing
        boards.
      </p>
      <div
        className="flex animate-in fade-in-0 slide-in-from-bottom-4 gap-3 duration-500 fill-mode-backwards"
        style={staggerDelay(2, 100)}
      >
        <Button asChild size="lg">
          <Link to="/register">Sign up</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
