import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Users, Loader2, AlertCircle } from "lucide-react";
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
        const communitiesResponse = await apiService.getCommunities(1, 100);
        const communitiesData = (communitiesResponse as any).data || (communitiesResponse as any) || [];
        const foundCommunity = communitiesData.find((c: any) => c.name === communityName);
        if (!foundCommunity) { setError('Community not found'); return; }
        setCommunity(foundCommunity);
        const postsResponse = await apiService.getCommunityPosts(foundCommunity.id);
        setPosts((postsResponse as any).data || (postsResponse as any) || []);
        if (user) {
          try {
            const userCommunitiesResponse = await apiService.getUserCommunities();
            const userCommunities = (userCommunitiesResponse as any).data || (userCommunitiesResponse as any) || [];
            setIsJoined(userCommunities.some((c: any) => c.id === foundCommunity.id));
          } catch { setIsJoined(false); }
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load community');
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
        await apiService.leaveCommunity(community.name); 
        setIsJoined(false); 
        toast({ title: `Left c/${community.name}` }); 
      }
      else { 
        await apiService.joinCommunity(community.name); 
        setIsJoined(true); 
        toast({ title: `Joined c/${community.name}` }); 
      }
      setCommunity(prev => prev ? { ...prev, member_count: isJoined ? prev.member_count - 1 : prev.member_count + 1 } : null);
    } catch { toast({ title: "Error", description: "Failed to join/leave", variant: "destructive" }); }
    finally { setJoining(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /><span className="ml-2 text-sm text-muted-foreground">Loading...</span></div>;
  if (error || !community) return <div className="flex flex-col items-center py-12"><AlertCircle className="h-6 w-6 text-destructive mb-2" /><p className="text-sm text-destructive">{error || 'Not found'}</p></div>;

  return (
    <div>
      <div className="bg-card rounded-md border p-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">c/{community.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{community.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{community.member_count.toLocaleString()} members</span>
              <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          {user && (
            <Button variant={isJoined ? "outline" : "default"} size="sm" onClick={handleJoinCommunity} disabled={joining}>
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : isJoined ? "Joined" : "Join"}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {posts.length > 0 ? posts.map(post => <PostCard key={post.id} post={post} />) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No posts yet.</p>
            {user && <Button size="sm" className="mt-3" asChild><a href={`/create-post?community=${community.name}`}>Create Post</a></Button>}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
