import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { HomePage } from "@/features/home/HomePage";
import { SearchPage } from "@/features/search/SearchPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { CreateBoardPage } from "@/features/boards/CreateBoardPage";
import { ViewBoardPage } from "@/features/boards/ViewBoardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="search" element={<SearchPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="boards/new" element={<CreateBoardPage />} />
            <Route path="boards/:id" element={<ViewBoardPage />} />
          </Route>

          <Route path=":username" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
