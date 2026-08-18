import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute/ProtectedRoute";
import { Layout } from "./components/Layout/Layout";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage/ResetPasswordPage";
import { GroupsListPage } from "./pages/GroupsListPage/GroupsListPage";
import { MyGroupsPage } from "./pages/MyGroupsPage/MyGroupsPage";
import { DiscoveryPage } from "./pages/DiscoveryPage/DiscoveryPage";
import { CreateGroupPage } from "./pages/CreateGroupPage/CreateGroupPage";
import { GroupDetailPage } from "./pages/GroupDetailPage/GroupDetailPage";
import { GroupAdminPage } from "./pages/GroupAdminPage/GroupAdminPage";
import { CreatePostPage } from "./pages/CreatePostPage/CreatePostPage";
import { PostDetailPage } from "./pages/PostDetailPage/PostDetailPage";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import { LeaderboardPage } from "./pages/LeaderboardPage/LeaderboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage/AdminDashboardPage";

const queryClient = new QueryClient();

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<GroupsListPage />} />
                <Route path="/my-groups" element={<MyGroupsPage />} />
                <Route path="/discovery" element={<DiscoveryPage />} />
                <Route path="/groups/new" element={<CreateGroupPage />} />
                <Route path="/groups/:id" element={<GroupDetailPage />} />
                <Route path="/groups/:id/admin" element={<GroupAdminPage />} />
                <Route path="/groups/:id/leaderboard" element={<LeaderboardPage />} />
                <Route path="/groups/:groupId/posts/new" element={<CreatePostPage />} />
                <Route path="/posts/:id" element={<PostDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
