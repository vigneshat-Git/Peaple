import { useState, useEffect } from "react";
import { Users, Flame, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { apiService } from "@/lib/api";

interface TrendingTopic {
  title: string;
  community: string;
  comments: number;
}

interface SuggestedCommunity {
  id: string;
  name: string;
  member_count: number;
  description?: string;
}

const DiscoverPanel = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<SuggestedCommunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const trendingResponse = await apiService.getTrendingPosts(1, 5);
        const trendingData = (trendingResponse as any).data || (trendingResponse as any) || [];
        setTrendingTopics(trendingData.map((post: any) => ({
          title: post.title,
          community: post.community?.name || 'unknown',
          comments: post.comment_count || 0
        })));

        const communitiesResponse = await apiService.getCommunities(1, 5);
        const communitiesData = (communitiesResponse as any).data || (communitiesResponse as any) || [];
        setSuggestedCommunities(communitiesData.map((c: any) => ({
          id: c.id, name: c.name, member_count: c.member_count || 0, description: c.description
        })));
      } catch (err) {
        console.error('Failed to fetch discover data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleJoinCommunity = async (communityId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await apiService.joinCommunity(communityId);
    } catch (err) {
      console.error('Failed to join community:', err);
    }
  };

  if (loading) {
    return (
      <aside className="hidden xl:block sticky top-[3.5rem] h-[calc(100vh-3.5rem)] overflow-y-auto py-4 space-y-4 scrollbar-thin">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden xl:block sticky top-[3.5rem] h-[calc(100vh-3.5rem)] overflow-y-auto py-4 space-y-4 scrollbar-thin">
      {/* Trending */}
      <div className="bg-card rounded-md border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Trending</h3>
        </div>
        <div className="space-y-3">
          {trendingTopics.length > 0 ? (
            trendingTopics.map((topic, i) => (
              <div key={i} className="cursor-pointer group">
                <p className="text-sm text-foreground group-hover:underline leading-snug font-medium">
                  {topic.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  c/{topic.community} · {topic.comments} comments
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No trending posts yet</p>
          )}
        </div>
      </div>

      {/* Suggested Communities */}
      <div className="bg-card rounded-md border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Suggested Communities</h3>
        </div>
        <div className="space-y-1">
          {suggestedCommunities.length > 0 ? (
            suggestedCommunities.map(c => (
              <Link
                key={c.id}
                to={`/c/${c.name}`}
                className="flex items-center justify-between p-2 rounded-md hover:bg-secondary transition-colors duration-150"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                    {c.name[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm text-foreground">c/{c.name}</span>
                    <p className="text-xs text-muted-foreground">{c.member_count.toLocaleString()} members</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleJoinCommunity(c.id, e)}
                  className="text-xs font-medium text-primary hover:underline transition-colors duration-150"
                >
                  Join
                </button>
              </Link>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No communities yet</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-2 text-xs text-muted-foreground space-y-1">
        <p>Peaple © 2026. All rights reserved.</p>
      </div>
    </aside>
  );
};

export default DiscoverPanel;
