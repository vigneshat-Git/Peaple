import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/peaple/AppLayout";
import HomePage from "@/pages/HomePage";
import CommunityPage from "@/pages/CommunityPage";
import PostPage from "@/pages/PostPage";
import CreatePostPage from "@/pages/CreatePostPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/popular" element={<HomePage />} />
            <Route path="/saved" element={<HomePage />} />
            <Route path="/c/:name" element={<CommunityPage />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/create-post" element={<CreatePostPage />} />
            <Route path="/user/:username" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
