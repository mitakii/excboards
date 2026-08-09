import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="max-w-2xl text-4xl font-semibold text-foreground">
        Sketch, diagram, and share boards with your team
      </h1>
      <p className="max-w-lg text-muted-foreground">
        excboards combines a drawing canvas with a blog-style layer for browsing and publishing
        boards.
      </p>
      <div className="flex gap-3">
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
