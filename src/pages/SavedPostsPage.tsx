import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Loader2 } from "lucide-react";
import PostCard, { PostData } from "@/components/peaple/PostCard";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface SavedPost extends PostData {
  savedAt: string;
}

const SavedPostsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchSavedPosts();
  }, [isAuthenticated, navigate]);

  const fetchSavedPosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const data = await apiService.getSavedPosts(pageNum, 20);
      
      // Transform posts to include timeAgo
      const transformedPosts = data.posts.map(post => ({
        ...post,
        author: post.author.username,
        community: post.community.name,
        comments: post.commentCount,
        votes: post.upvotes,
        timeAgo: formatTimeAgo(new Date(post.savedAt)),
        isSaved: true,
      }));

      if (pageNum === 1) {
        setPosts(transformedPosts);
      } else {
        setPosts(prev => [...prev, ...transformedPosts]);
      }
      
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch saved posts:", error);
      toast({
        title: "Error",
        description: "Failed to load saved posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchSavedPosts(page + 1);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Bookmark className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Saved Posts</h1>
          <span className="text-sm text-muted-foreground">
            {posts.length > 0 && `(${posts.length})`}
          </span>
        </div>

        {/* Posts */}
        {loading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No saved posts yet
            </h2>
            <p className="text-muted-foreground mb-4">
              Posts you save will appear here for easy access
            </p>
            <Button onClick={() => navigate("/")}>
              Browse Feed
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPostsPage;
