import { Link, useLocation } from "react-router-dom";
import { FileQuestionIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStatus } from "@/features/auth/queries";

interface NotFoundProps {
  title?: string;
  description?: string;
  suggestLogin?: boolean;
}

export function NotFound({
  title = "Page not found",
  description = "The page you're looking for doesn't exist or has been moved.",
  suggestLogin = false,
}: NotFoundProps) {
  const { data: user } = useStatus();
  const location = useLocation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <FileQuestionIcon className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
        {suggestLogin && !user && (
          <Button asChild>
            <Link to="/login" state={{ from: location }}>
              Log in
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
