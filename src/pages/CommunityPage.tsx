import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Users, Shield, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard, { PostData } from "@/components/peaple/PostCard";
import { apiService, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Community {
  id: string;
  name: string;
  description: string;
  member_count: number;
  created_at: string;
  icon_url?: string;
  banner_url?: string;
  created_by: string;
}

const CommunityPage = () => {
  const { communityName } = useParams();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!communityName) return;
      
      try {
        setLoading(true);
        setError(null);

        // Find community by name
        const communitiesResponse = await apiService.getCommunities(1, 100);
        const communitiesData = (communitiesResponse as any).data || (communitiesResponse as any) || [];
        const foundCommunity = communitiesData.find((c: any) => c.name === communityName);

        if (!foundCommunity) {
          setError('Community not found');
          return;
        }

        setCommunity(foundCommunity);

        // Get community posts
        const postsResponse = await apiService.getCommunityPosts(foundCommunity.id);
        const postsData = (postsResponse as any).data || (postsResponse as any) || [];
        setPosts(postsData);

        // Check if user is member (we'll need to implement this endpoint)
        if (user) {
          try {
            const userCommunitiesResponse = await apiService.getUserCommunities();
            const userCommunities = (userCommunitiesResponse as any).data || (userCommunitiesResponse as any) || [];
            setIsJoined(userCommunities.some((c: any) => c.id === foundCommunity.id));
          } catch (err) {
            // User might not be authenticated or endpoint not implemented
            setIsJoined(false);
          }
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load community');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [communityName, user]);

  const handleJoinCommunity = async () => {
    if (!community || !user) return;

    try {
      setJoining(true);
      if (isJoined) {
        await apiService.leaveCommunity(community.id);
        setIsJoined(false);
        toast({
          title: "Left community",
          description: `You have left c/${community.name}`,
        });
      } else {
        await apiService.joinCommunity(community.id);
        setIsJoined(true);
        toast({
          title: "Joined community",
          description: `You have joined c/${community.name}`,
        });
      }
      
      // Update member count
      setCommunity(prev => prev ? {
        ...prev,
        member_count: isJoined ? prev.member_count - 1 : prev.member_count + 1
      } : null);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to join/leave community",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading community...</span>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive mb-4">{error || 'Community not found'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-lg p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">c/{community.name}</h1>
            <p className="text-primary-foreground/80 text-sm mt-1">
              {community.description}
            </p>
            <div className="flex items-center gap-4 mt-3 text-primary-foreground/80 text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {community.member_count.toLocaleString()} members
              </span>
              <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          {user && (
            <Button 
              onClick={handleJoinCommunity}
              disabled={joining}
              className="bg-card text-foreground hover:bg-secondary font-medium"
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isJoined ? 'Leaving...' : 'Joining...'}
                </>
              ) : (
                <>
                  {isJoined ? 'Leave Community' : 'Join Community'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts in this community yet.</p>
            {user && (
              <Button className="mt-4" asChild>
                <a href={`/create-post?community=${community.name}`}>Create First Post</a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
