import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PostCard, { PostData } from "@/components/peaple/PostCard";
import PostSkeleton from "@/components/peaple/PostSkeleton";
import { apiService, ApiError } from "@/lib/api";
import { Loader2, AlertCircle, Users, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const sortOptions = ["Hot", "New", "Top"];

interface Community {
  id: string;
  name: string;
  description: string;
  member_count: number;
  icon_url?: string;
}

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
  
  const [topCommunities, setTopCommunities] = useState<Community[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const { user, isAuthenticated } = useAuth();

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

  // Fetch top and suggested communities
  useEffect(() => {
    const fetchCommunities = async () => {
      setLoadingCommunities(true);
      try {
        // Fetch top communities
        const topResponse = await apiService.getTopCommunities(5);
        const topData = (topResponse as any).data || topResponse || [];
        setTopCommunities(topData);

        // Fetch suggested communities for logged-in users
        if (isAuthenticated) {
          try {
            const suggestedResponse = await apiService.getSuggestedCommunities(5);
            const suggestedData = (suggestedResponse as any).data || suggestedResponse || [];
            setSuggestedCommunities(suggestedData);
          } catch {
            setSuggestedCommunities([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch communities:", error);
      } finally {
        setLoadingCommunities(false);
      }
    };
    fetchCommunities();
  }, [isAuthenticated]);

  const handleLoadMore = () => { setPage(prev => prev + 1); fetchPosts(false); };

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-2">
        <div className="bg-card rounded-md border p-2 mb-3 flex items-center gap-1 h-10">
          <div className="h-6 bg-muted rounded w-16 mx-1"></div>
          <div className="h-6 bg-muted rounded w-16 mx-1"></div>
          <div className="h-6 bg-muted rounded w-16 mx-1"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
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
    <div className="space-y-4">
      {/* Communities Section */}
      {!loadingCommunities && (topCommunities.length > 0 || suggestedCommunities.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Communities */}
          {topCommunities.length > 0 && (
            <div className="bg-card rounded-md border p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Top Communities</h2>
              </div>
              <div className="space-y-2">
                {topCommunities.map((community, index) => (
                  <Link
                    key={community.id}
                    to={`/c/${community.name}`}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary transition-colors"
                  >
                    <span className="text-xs font-medium text-muted-foreground w-4">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        c/{community.name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {community.member_count.toLocaleString()} members
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Communities */}
          {isAuthenticated && suggestedCommunities.length > 0 && (
            <div className="bg-card rounded-md border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Suggested Communities</h2>
              </div>
              <div className="space-y-2">
                {suggestedCommunities.map((community) => (
                  <Link
                    key={community.id}
                    to={`/c/${community.name}`}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        c/{community.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {community.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sort Tabs */}
      <div className="bg-card rounded-md border p-2 flex items-center gap-1">
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
      
      {/* Posts */}
      {posts.length === 0 && !loading ? (
        <div className="text-center py-12 bg-card rounded-md border">
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
                {loading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-pulse bg-muted rounded-full"></div>
                    Loading...
                  </>
                ) : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
