import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiService, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Community { id: string; name: string; description: string; member_count: number; }

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
        const data = (response as any).data || (response as any) || [];
        setCommunities(data);
        const communityName = searchParams.get('community');
        if (communityName) {
          const c = data.find((c: any) => c.name === communityName);
          if (c) setSelectedCommunity(c.id);
        }
      } catch (err) { console.error('Failed to fetch communities:', err); }
    };
    fetchCommunities();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Auth required", description: "Please log in", variant: "destructive" }); return; }
    if (!selectedCommunity || !title.trim() || !content.trim()) { setError("Fill in all fields"); return; }
    try {
      setLoading(true); setError(null);
      await apiService.createPost({ title: title.trim(), content: content.trim(), community_id: selectedCommunity });
      const community = communities.find(c => c.id === selectedCommunity);
      toast({ title: "Post created" });
      navigate(`/c/${community?.name}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create post");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-lg font-bold text-foreground mb-4">Create a Post</h1>
      <form onSubmit={handleSubmit} className="bg-card rounded-md border p-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="community" className="text-sm">Community</Label>
          <select id="community" value={selectedCommunity} onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors duration-150" required>
            <option value="">Select a community</option>
            {communities.map(c => <option key={c.id} value={c.id}>c/{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-sm">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="An interesting title..." required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="content" className="text-sm">Content</Label>
          <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts..." rows={6} required />
        </div>
        {error && <div className="flex items-center gap-2 text-destructive text-xs"><AlertCircle className="h-3.5 w-3.5" />{error}</div>}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1" size="sm">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Post"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostPage;
