import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Calendar, Star, MessageSquare, Loader2 } from "lucide-react";
import UserAvatar from "@/components/peaple/UserAvatar";
import PostCard, { PostData } from "@/components/peaple/PostCard";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  profile_image?: string;
  bio?: string;
  created_at: string;
  karma?: number;
}

interface Comment {
  id: string;
  content: string;
  post_id: string;
  parent_comment_id?: string;
  created_at: string;
  votes?: number;
  post_title?: string;
  community_name?: string;
}

const tabs = ["Posts", "Comments", "Saved"];

const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const isOwnProfile = currentUser?.username === username;

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;
      setLoadingProfile(true);
      try {
        const response = await apiService.getUserByUsername(username);
        const userData = (response as any).data || response;
        setUserProfile(userData);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load user profile",
          variant: "destructive",
        });
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchUserProfile();
  }, [username, toast]);

  // Fetch user posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!userProfile?.id) return;
      setLoadingPosts(true);
      try {
        const response = await apiService.getUserPosts(userProfile.id);
        const postsData = (response as any).data || (response as any).posts || response;
        setPosts(Array.isArray(postsData) ? postsData : []);
      } catch (error: any) {
        console.error("Failed to load user posts:", error);
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchUserPosts();
  }, [userProfile?.id]);

  // Fetch user comments
  useEffect(() => {
    const fetchUserComments = async () => {
      if (!userProfile?.id) return;
      setLoadingComments(true);
      try {
        const response = await apiService.getUserComments(userProfile.id);
        const commentsData = (response as any).data || (response as any).comments || response;
        setComments(Array.isArray(commentsData) ? commentsData : []);
      } catch (error: any) {
        console.error("Failed to load user comments:", error);
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    };
    fetchUserComments();
  }, [userProfile?.id]);

  // Fetch saved posts (only for own profile)
  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!isOwnProfile) {
        setSavedPosts([]);
        setLoadingSaved(false);
        return;
      }
      setLoadingSaved(true);
      try {
        const response = await apiService.getSavedPosts();
        const postsData = (response as any).data || response;
        setSavedPosts(Array.isArray(postsData) ? postsData : []);
      } catch (error: any) {
        console.error("Failed to load saved posts:", error);
        setSavedPosts([]);
      } finally {
        setLoadingSaved(false);
      }
    };
    fetchSavedPosts();
  }, [isOwnProfile]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loadingProfile) {
    return (
      <div className="max-w-3xl flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-3xl text-center py-20">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Profile Header */}
      <div className="bg-card rounded-md border p-4 mb-3">
        <div className="flex items-start gap-4">
          <UserAvatar 
            name={userProfile.username} 
            image={userProfile.profile_image} 
            size="lg" 
          />
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">u/{userProfile.username}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {userProfile.bio || "No bio yet"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">{userProfile.karma || 0}</span> karma
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {formatDate(userProfile.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 mb-3 border-b border-border">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
              activeTab === i
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-2">
        {activeTab === 0 && (
          <>
            {loadingPosts ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-10 bg-card rounded-md border">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === 1 && (
          <>
            {loadingComments ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="bg-card rounded-md border p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>Commented on</span>
                    <Link 
                      to={`/post/${comment.post_id}`} 
                      className="font-medium text-foreground hover:underline"
                    >
                      {comment.post_title || "Unknown post"}
                    </Link>
                    {comment.community_name && (
                      <>
                        <span>in</span>
                        <Link 
                          to={`/c/${comment.community_name}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          c/{comment.community_name}
                        </Link>
                      </>
                    )}
                    <span>·</span>
                    <span>{getTimeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {comment.votes || 0} votes
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-card rounded-md border">
                <p className="text-muted-foreground">No comments yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === 2 && (
          <>
            {!isOwnProfile ? (
              <div className="text-center py-10 bg-card rounded-md border">
                <p className="text-muted-foreground">You can only view your own saved posts</p>
              </div>
            ) : loadingSaved ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : savedPosts.length > 0 ? (
              savedPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-10 bg-card rounded-md border">
                <p className="text-muted-foreground">No saved posts yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
