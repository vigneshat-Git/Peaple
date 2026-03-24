import { useState, useEffect } from "react";
import PostCard, { PostData } from "@/components/peaple/PostCard";
import { apiService, ApiError } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const sortOptions = ["Hot", "New", "Top"];

// Helper function for formatting time
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
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

const HomePage = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState("Hot");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Handle vote changes from PostCard
  const handleVoteChange = (postId: string, newVotes: number, userVote: "up" | "down" | null) => {
    setPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, upvotes: newVotes, votes: newVotes }
          : post
      )
    );
  };

  const fetchPosts = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const sortMap = { "Hot": "hot", "New": "new", "Top": "top" };
      const sortValue = sortMap[activeSort as keyof typeof sortMap] || "new";
      
      const response = await apiService.getFeed(currentPage, 20, sortValue);
      
      const postsData = (response as any).data || (response as any) || [];
      
      // Add timeAgo field to each post
      const postsWithTimeAgo = postsData.map((post: any) => ({
        ...post,
        timeAgo: formatTime(post.created_at)
      }));
      
      if (reset) {
        setPosts(postsWithTimeAgo);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...postsWithTimeAgo]);
      }
      
      setHasMore(postsData.length === 20);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load posts");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(true);
  }, [activeSort]);

  const handleSortChange = (sort: string) => {
    setActiveSort(sort);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchPosts(false);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading posts...</span>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => fetchPosts(true)}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {sortOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSortChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeSort === opt
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      
      {posts.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts found. Be the first to create one!</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onVoteChange={(newVotes, userVote) => handleVoteChange(post.id, newVotes, userVote)}
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
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
        </>
      )}
    </div>
  );
};

export default HomePage;
