import { useParams } from "react-router-dom";
import { useState } from "react";
import { Calendar, Star } from "lucide-react";
import UserAvatar from "@/components/peaple/UserAvatar";
import PostCard, { PostData } from "@/components/peaple/PostCard";

const tabs = ["Posts", "Comments", "Saved"];

const mockPosts: PostData[] = [
  {
    id: "1",
    title: "Why Server Components are the future of React",
    content: "After spending 6 months building with RSC in production...",
    author: "johndoe",
    community: "webdev",
    votes: 342,
    comments: 89,
    tags: ["react", "server-components"],
    timeAgo: "3h ago",
  },
];

const ProfilePage = () => {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="bg-card rounded-lg border p-6 mb-4">
        <div className="flex items-start gap-4">
          <UserAvatar name="John Doe" size="lg" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{username}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Full-stack developer passionate about React, TypeScript, and building great user experiences.
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">4,250</span> reputation
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined March 2024
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
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

export default ProfilePage;
