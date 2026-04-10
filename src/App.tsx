import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { VideoProvider } from "@/contexts/VideoContext";
import AppLayout from "@/components/peaple/AppLayout";
import ProtectedRoute from "@/components/peaple/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import SavedPostsPage from "@/pages/SavedPostsPage";
import CommunityPage from "@/pages/CommunityPage";
import PostPage from "@/pages/PostPage";
import CreatePostPage from "@/pages/CreatePostPage";
import CreateCommunityPage from "@/pages/CreateCommunityPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import GoogleCallback from "@/pages/GoogleCallback";
import VideoDemoPage from "@/pages/VideoDemoPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <VideoProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/video-demo" element={<VideoDemoPage />} />

            {/* App routes with shared layout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/popular" element={<HomePage />} />
              <Route
                path="/saved"
                element={
                  <ProtectedRoute>
                    <SavedPostsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/c/:communityName" element={<CommunityPage />} />
              <Route path="/post/:id" element={<PostPage />} />
              <Route
                path="/create-post"
                element={
                  <ProtectedRoute>
                    <CreatePostPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-community"
                element={
                  <ProtectedRoute>
                    <CreateCommunityPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/user/:username" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
            </VideoProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
