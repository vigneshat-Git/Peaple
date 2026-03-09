import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AppLayout from "@/components/peaple/AppLayout";
import ProtectedRoute from "@/components/peaple/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import CommunityPage from "@/pages/CommunityPage";
import PostPage from "@/pages/PostPage";
import CreatePostPage from "@/pages/CreatePostPage";
import CreateCommunityPage from "@/pages/CreateCommunityPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
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
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* App routes with shared layout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/popular" element={<HomePage />} />
              <Route path="/saved" element={<HomePage />} />
              <Route path="/c/:name" element={<CommunityPage />} />
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
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
