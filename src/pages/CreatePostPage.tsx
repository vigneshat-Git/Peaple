import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Image, X, Tag, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiService, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Community {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

const CreatePostPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await apiService.getCommunities(1, 100);
        const communitiesData = (response as any).data || (response as any) || [];
        setCommunities(communitiesData);

        // Pre-select community if specified in URL
        const communityName = searchParams.get('community');
        if (communityName) {
          const community = communitiesData.find((c: any) => c.name === communityName);
          if (community) {
            setSelectedCommunity(community.id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch communities:', err);
      }
    };

    fetchCommunities();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a post",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCommunity || !title.trim() || !content.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await apiService.createPost({
        title: title.trim(),
        content: content.trim(),
        community_id: selectedCommunity,
      });

      const community = communities.find(c => c.id === selectedCommunity);
      toast({
        title: "Post created",
        description: "Your post has been published successfully",
      });

      navigate(`/c/${community?.name}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create post");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-foreground mb-6">Create Post</h1>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-6 space-y-5">
        {/* Community select */}
        <div>
          <Label htmlFor="community">Community</Label>
          <select
            id="community"
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          >
            <option value="">Select a community</option>
            {communities.map(c => (
              <option key={c.id} value={c.id}>c/{c.name}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="An interesting title..."
            required
          />
        </div>

        {/* Content */}
        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={8}
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Post"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostPage;
