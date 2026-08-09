import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useStatus } from "./queries";

export function ProtectedRoute() {
  const { data: user, isLoading } = useStatus();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
