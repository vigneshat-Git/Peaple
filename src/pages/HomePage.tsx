import { useState, useEffect } from "react";
import PostCard, { PostData } from "@/components/peaple/PostCard";
import { apiService, ApiError } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const sortOptions = ["Hot", "New", "Top"];

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return `${Math.floor(diffInHours / 24)}d ago`;
  }
};

const HomePage = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState("Hot");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const handleVoteChange = (postId: string, newVotes: number) => {
    setPosts(prev => prev.map(post => post.id === postId ? { ...post, upvotes: newVotes, votes: newVotes } : post));
  };

  const fetchPosts = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      const currentPage = reset ? 1 : page;
      const sortMap = { "Hot": "hot", "New": "new", "Top": "top" };
      const response = await apiService.getFeed(currentPage, 20, sortMap[activeSort as keyof typeof sortMap] || "new");
      const postsData = (response as any).data || (response as any) || [];
      const postsWithTimeAgo = postsData.map((post: any) => ({ ...post, timeAgo: formatTime(post.created_at) }));
      if (reset) { setPosts(postsWithTimeAgo); setPage(1); } 
      else { setPosts(prev => [...prev, ...postsWithTimeAgo]); }
      setHasMore(postsData.length === 20);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(true); }, [activeSort]);

  const handleLoadMore = () => { setPage(prev => prev + 1); fetchPosts(false); };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-6 w-6 text-destructive mb-2" />
        <p className="text-sm text-destructive mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={() => fetchPosts(true)}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-card rounded-md border p-2 mb-3 flex items-center gap-1">
        {sortOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setActiveSort(opt)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
              activeSort === opt
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      
      {posts.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No posts yet. Be the first to create one!</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onVoteChange={(newVotes) => handleVoteChange(post.id, newVotes)} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</> : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
