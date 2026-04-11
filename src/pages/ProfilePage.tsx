import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Calendar, Star, MessageSquare, Loader2, Pencil, Camera, Check, X } from "lucide-react";
import UserAvatar from "@/components/peaple/UserAvatar";
import PostCard, { PostData } from "@/components/peaple/PostCard";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

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

  // Edit profile dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editProfileImage, setEditProfileImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Edit profile functions
  const openEditDialog = () => {
    if (!userProfile) return;
    setEditUsername(userProfile.username);
    setEditBio(userProfile.bio || "");
    setEditProfileImage(userProfile.profile_image || "");
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setIsSaving(false);
    setIsUploading(false);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPEG, PNG, and WebP images are allowed",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl, fileUrl } = await apiService.generateUploadUrl(file.type);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      setEditProfileImage(fileUrl);
      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !userProfile) return;

    setIsSaving(true);
    try {
      const response = await apiService.updateUser({
        username: editUsername.trim(),
        bio: editBio.trim(),
        profile_image: editProfileImage,
      });

      const updatedUser = (response as any).data || response;
      
      // Update local profile state
      setUserProfile({
        ...userProfile,
        username: updatedUser.username || editUsername,
        bio: updatedUser.bio || editBio,
        profile_image: updatedUser.profile_image || editProfileImage,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      closeEditDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = 
    editUsername !== userProfile?.username || 
    editBio !== (userProfile?.bio || "") || 
    editProfileImage !== (userProfile?.profile_image || "");

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
            <div className="flex items-start justify-between">
              <h1 className="text-lg font-bold text-foreground">u/{userProfile.username}</h1>
              {isOwnProfile && (
                <button
                  onClick={openEditDialog}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Profile
                </button>
              )}
            </div>
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

      {/* Edit Profile Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>
              <button
                onClick={closeEditDialog}
                className="p-1 hover:bg-secondary rounded-md transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Profile Image */}
              <div className="flex items-center gap-4">
                <div 
                  className="relative cursor-pointer group"
                  onClick={handleImageClick}
                >
                  <UserAvatar 
                    name={editUsername || userProfile.username} 
                    image={editProfileImage} 
                    size="lg" 
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Profile Picture</p>
                  <p className="text-xs text-muted-foreground">
                    Click to upload (max 5MB)
                  </p>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={3}
                  maxLength={160}
                  className="w-full px-3 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {editBio.length}/160
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={closeEditDialog}
                  className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={!hasChanges || isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
