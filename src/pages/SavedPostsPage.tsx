import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import PostCard from "@/components/peaple/PostCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Post {
  id: string;
  title: string;
  content: string;
  author: { id: string; username: string; avatar: string };
  community: { id: string; name: string };
  upvotes: number;
  downvotes: number;
  commentCount: number;
  media: Array<{ id: string; url: string; type: string; file_name?: string }>;
  createdAt: string;
  isSaved: boolean;
}

const SavedPostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { toast } = useToast();

  const fetchSavedPosts = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await apiService.getSavedPosts(pageNum, 20);
      
      if (pageNum === 1) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }
      
      setHasMore(response.pagination?.hasMore || false);
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
      toast({
        title: "Error",
        description: "Failed to load saved posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSavedPosts(nextPage);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 py-4 border-b border-border">
        <Bookmark className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Saved Posts</h1>
      </div>

      {/* Empty State */}
      {posts.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bookmark className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No saved posts yet</h2>
          <p className="text-muted-foreground max-w-sm">
            Posts you save will appear here. Click the bookmark icon on any post to save it for later.
          </p>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-0 sm:space-y-4">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={{
              id: post.id,
              title: post.title,
              content: post.content,
              author: post.author,
              community: post.community,
              upvotes: post.upvotes,
              downvotes: post.downvotes,
              comments: post.commentCount,
              media: post.media,
              timeAgo: new Date(post.createdAt).toLocaleDateString(),
              isSaved: true
            }}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default SavedPostsPage;
