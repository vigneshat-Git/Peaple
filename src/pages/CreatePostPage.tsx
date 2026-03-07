import { useState } from "react";
import { Image, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

const communities = ["webdev", "startups", "design", "trading", "typescript", "indie-hackers"];

const CreatePostPage = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-foreground mb-6">Create Post</h1>

      <div className="bg-card rounded-lg border p-6 space-y-5">
        {/* Community select */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Community</label>
          <select className="w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <option value="">Select a community</option>
            {communities.map(c => (
              <option key={c} value={c}>c/{c}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
          <input
            type="text"
            placeholder="An interesting title..."
            className="w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Content</label>
          <textarea
            placeholder="Share your thoughts..."
            rows={8}
            className="w-full p-3 rounded-lg border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Image (optional)</label>
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Tags</label>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary-light text-primary-dark rounded-md">
                {tag}
                <button onClick={() => setTags(tags.filter(t => t !== tag))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
              className="flex-1 h-9 px-3 rounded-lg border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <Button onClick={addTag} size="sm" variant="outline" className="text-xs">
              <Tag className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
        </div>

        {/* Submit */}
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-dark btn-primary-glow font-medium">
          Publish Post
        </Button>
      </div>
    </div>
  );
};

export default CreatePostPage;
