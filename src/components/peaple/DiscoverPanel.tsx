import { useState, useEffect } from "react";
import { TrendingUp, Users, Flame, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import { apiService, ApiError } from "@/lib/api";

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

interface ActiveUser {
  id: string;
  username: string;
  reputation?: number;
}

const DiscoverPanel = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<SuggestedCommunity[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch trending posts
        const trendingResponse = await apiService.getTrendingPosts(1, 5);
        const trendingData = (trendingResponse as any).data || (trendingResponse as any) || [];
        const topics: TrendingTopic[] = trendingData.map((post: any) => ({
          title: post.title,
          community: post.community?.name || 'unknown',
          comments: post.comment_count || 0
        }));

        // Fetch communities
        const communitiesResponse = await apiService.getCommunities(1, 5);
        const communitiesData = (communitiesResponse as any).data || (communitiesResponse as any) || [];
        const communities: SuggestedCommunity[] = communitiesData.map((community: any) => ({
          id: community.id,
          name: community.name,
          member_count: community.member_count || 0,
          description: community.description
        }));

        // Note: We'll need to implement a top users endpoint in the backend
        // For now, using empty array
        const users: ActiveUser[] = [];

        setTrendingTopics(topics);
        setSuggestedCommunities(communities);
        setActiveUsers(users);
      } catch (err) {
        console.error('Failed to fetch discover data:', err);
        setError('Failed to load data');
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
      // Refresh communities list
      const communitiesResponse = await apiService.getCommunities(1, 5);
      const communitiesData = (communitiesResponse as any).data || (communitiesResponse as any) || [];
      setSuggestedCommunities(communitiesData);
    } catch (err) {
      console.error('Failed to join community:', err);
    }
  };

  if (loading) {
    return (
      <aside className="w-72 shrink-0 hidden xl:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pl-2 space-y-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 shrink-0 hidden xl:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pl-2 space-y-5">
      {/* Trending */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Trending</h3>
        </div>
        <div className="space-y-3">
          {trendingTopics.length > 0 ? (
            trendingTopics.map((topic, i) => (
              <div key={i} className="group cursor-pointer">
                <p className="text-sm text-foreground group-hover:text-primary transition-colors leading-snug font-medium">
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
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Suggested</h3>
        </div>
        <div className="space-y-2">
          {suggestedCommunities.length > 0 ? (
            suggestedCommunities.map(c => (
              <Link
                key={c.id}
                to={`/c/${c.name}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary-light flex items-center justify-center text-primary-dark font-bold text-xs">
                    {c.name[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm text-foreground">c/{c.name}</span>
                    <p className="text-xs text-muted-foreground">{c.member_count.toLocaleString()} members</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleJoinCommunity(c.id, e)}
                  className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
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

      {/* Active Users */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Top Contributors</h3>
        </div>
        <div className="space-y-2.5">
          {activeUsers.length > 0 ? (
            activeUsers.map((user, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <UserAvatar name={user.username} size="sm" />
                <div>
                  <p className="text-sm font-medium text-foreground">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{(user.reputation || 0).toLocaleString()} rep</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No active users yet</p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default DiscoverPanel;
