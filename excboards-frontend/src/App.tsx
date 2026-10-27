import { Suspense, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/layout/Layout";
import { NotFound } from "@/components/NotFound";
import { Spinner } from "@/components/ui/spinner";
import { lazyPage } from "@/lib/lazyPage";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { GoogleSignupPage } from "@/features/auth/GoogleSignupPage";
import { HomePage } from "@/features/home/HomePage";
import { SearchPage } from "@/features/search/SearchPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { SettingsPage } from "@/features/settings/SettingsPage";

// board pages pull in Excalidraw, so keep them out of the entry bundle
const ViewBoardPage = lazyPage(
  () => import("@/features/boards/ViewBoardPage"),
  "ViewBoardPage"
);
const WorldBoardPage = lazyPage(
  () => import("@/features/worldBoard/WorldBoardPage"),
  "WorldBoardPage"
);

function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Spinner />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* last resort for crashes in Layout itself; pages have their own boundary inside Layout */}
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="signup/google" element={<GoogleSignupPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route
              path="world"
              element={
                <PageSuspense>
                  <WorldBoardPage />
                </PageSuspense>
              }
            />
            <Route
              path="world/:id"
              element={
                <PageSuspense>
                  <WorldBoardPage />
                </PageSuspense>
              }
            />
            {/* public: anonymous visitors get published boards read-only */}
            <Route
              path="boards/:id"
              element={
                <PageSuspense>
                  <ViewBoardPage />
                </PageSuspense>
              }
            />

            <Route element={<ProtectedRoute />}>
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="u/:username" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
