import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiService, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const CreateCommunityPage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Community name is required";
    else if (name.length < 3) newErrors.name = "Min 3 characters";
    else if (name.length > 21) newErrors.name = "Max 21 characters";
    else if (!/^[a-zA-Z0-9_]+$/.test(name)) newErrors.name = "Letters, numbers, underscores only";
    if (!description.trim()) newErrors.description = "Description is required";
    else if (description.length < 10) newErrors.description = "Min 10 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Auth required", description: "Please log in first", variant: "destructive" }); return; }
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const community: any = await apiService.createCommunity({ name: name.toLowerCase(), description });
      toast({ title: "Community created!", description: `c/${community.name} is live.` });
      navigate(`/c/${community.name}`);
    } catch (error: any) {
      toast({ title: "Failed", description: error instanceof ApiError ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6">
      <h1 className="text-lg font-bold text-foreground mb-1">Create a Community</h1>
      <p className="text-sm text-muted-foreground mb-6">Build a space for people with shared interests</p>

      <div className="bg-card rounded-md border p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm">Name</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">c/</span>
              <Input id="name" placeholder="programming" value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                className={`pl-8 ${errors.name ? "border-destructive" : ""}`} maxLength={21} />
            </div>
            <p className="text-xs text-muted-foreground">{21 - name.length} characters remaining</p>
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea id="description" placeholder="What is this community about?"
              value={description} onChange={(e) => setDescription(e.target.value)}
              className={`min-h-[80px] resize-none ${errors.description ? "border-destructive" : ""}`} maxLength={500} />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rules" className="text-sm">Rules <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="rules" placeholder="1. Be respectful&#10;2. No spam" value={rules}
              onChange={(e) => setRules(e.target.value)} className="min-h-[80px] resize-none" maxLength={2000} />
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Community"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunityPage;
