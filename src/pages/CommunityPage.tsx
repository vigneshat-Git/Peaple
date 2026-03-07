import { useParams } from "react-router-dom";
import { Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard, { PostData } from "@/components/peaple/PostCard";

const mockPosts: PostData[] = [
  {
    id: "1",
    title: "Why Server Components are the future of React",
    content: "After spending 6 months building with RSC in production, here's what I've learned...",
    author: "sarah_dev",
    community: "webdev",
    votes: 342,
    comments: 89,
    tags: ["react", "server-components"],
    timeAgo: "3h ago",
  },
  {
    id: "2",
    title: "TypeScript 6.0 features you need to know about",
    content: "The latest TypeScript release brings pattern matching and pipe operator support...",
    author: "ts_guru",
    community: "webdev",
    votes: 289,
    comments: 63,
    tags: ["typescript", "programming"],
    timeAgo: "1d ago",
  },
];

const CommunityPage = () => {
  const { name } = useParams();

  return (
    <div>
      {/* Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-lg p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">c/{name}</h1>
            <p className="text-primary-foreground/80 text-sm mt-1">
              A community for web development discussions, tips, and resources.
            </p>
            <div className="flex items-center gap-4 mt-3 text-primary-foreground/80 text-sm">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> 42,800 members</span>
              <span>Created Jan 2024</span>
            </div>
          </div>
          <Button className="bg-card text-foreground hover:bg-secondary font-medium">
            Join Community
          </Button>
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 mb-4">
        {["Hot", "New", "Top"].map((opt, i) => (
          <button
            key={opt}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {mockPosts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
