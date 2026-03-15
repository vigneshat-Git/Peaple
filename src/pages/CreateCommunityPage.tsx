import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, FileText, Shield, Loader2 } from "lucide-react";
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
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Community name is required";
    } else if (name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    } else if (name.length > 21) {
      newErrors.name = "Name must be 21 characters or less";
    } else if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      newErrors.name = "Name can only contain letters, numbers, and underscores";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a community",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const community = await apiService.createCommunity({
        name: name.toLowerCase(),
        description,
      });

      toast({
        title: "Community created!",
        description: `c/${community.name} is now live.`,
      });
      navigate(`/c/${community.name}`);
    } catch (error: any) {
      if (error instanceof ApiError) {
        toast({
          title: "Failed to create community",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to create community",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Create a Community</h1>
          <p className="text-muted-foreground mt-1">
            Build a space for people to connect around shared interests
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-sm border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Community Name
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  c/
                </span>
                <Input
                  id="name"
                  type="text"
                  placeholder="programming"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  className={`pl-9 ${errors.name ? "border-destructive" : ""}`}
                  maxLength={21}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {21 - name.length} characters remaining. Cannot be changed later.
              </p>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="What is this community about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`min-h-[100px] resize-none ${errors.description ? "border-destructive" : ""}`}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {500 - description.length} characters remaining
              </p>
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Community Rules
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="rules"
                placeholder="1. Be respectful&#10;2. No spam&#10;3. Stay on topic"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                Define guidelines for your community members
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-primary-glow"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Community"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-secondary/50 rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-3">Tips for success</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Choose a clear, memorable name that reflects your community's purpose
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Write a description that helps people understand what to expect
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Set clear rules early to maintain a positive environment
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateCommunityPage;
