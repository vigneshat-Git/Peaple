import { useParams } from "react-router-dom";
import VoteButtons from "@/components/peaple/VoteButtons";
import UserAvatar from "@/components/peaple/UserAvatar";
import CommentThread, { CommentData } from "@/components/peaple/CommentThread";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Share2 } from "lucide-react";

const mockComments: CommentData[] = [
  {
    id: "1",
    author: "dev_mike",
    content: "Great writeup! I've been using RSC in production for 3 months now and completely agree with your performance observations. The initial learning curve is steep but worth it.",
    votes: 45,
    timeAgo: "2h ago",
    replies: [
      {
        id: "1a",
        author: "sarah_dev",
        content: "Thanks Mike! The learning curve is definitely real. What patterns have worked best for you when deciding what to render on the server vs client?",
        votes: 22,
        timeAgo: "1h ago",
        replies: [
          {
            id: "1aa",
            author: "dev_mike",
            content: "I generally default to server components and only use 'use client' when I need interactivity. It simplifies the mental model significantly.",
            votes: 18,
            timeAgo: "45m ago",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    author: "fullstack_jen",
    content: "How do you handle state management with RSC? I've been struggling with the boundary between server and client state.",
    votes: 31,
    timeAgo: "1h ago",
  },
];

const PostPage = () => {
  const { id } = useParams();

  return (
    <div className="max-w-3xl">
      <div className="bg-card rounded-lg border p-6 mb-4">
        <div className="flex gap-4">
          <VoteButtons initialVotes={342} />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">c/webdev</span>
              <span>•</span>
              <span>Posted by sarah_dev</span>
              <span>•</span>
              <span>3h ago</span>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-4">
              Why Server Components are the future of React
            </h1>
            <div className="prose prose-sm text-foreground max-w-none mb-4">
              <p>After spending 6 months building with React Server Components in production, I want to share my experience and insights. This isn't just theoretical — these are lessons learned from a real application serving millions of users.</p>
              <h3>Performance Improvements</h3>
              <p>The most immediate benefit we saw was a 40% reduction in JavaScript bundle size. By moving data fetching and heavy computations to the server, our Time to Interactive dropped significantly.</p>
              <h3>Developer Experience</h3>
              <p>The mental model of "server by default, client when needed" has simplified our codebase considerably. New team members can be productive much faster.</p>
            </div>
            <div className="flex items-center gap-2 mb-4">
              {["react", "server-components", "performance"].map(tag => (
                <Badge key={tag} variant="secondary" className="bg-primary-light text-primary-dark border-0 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Bookmark className="h-4 w-4" /> Save
              </button>
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add comment */}
      <div className="bg-card rounded-lg border p-4 mb-4">
        <textarea
          placeholder="What are your thoughts?"
          className="w-full p-3 text-sm border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-dark transition-colors">
            Comment
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">89 Comments</h3>
        <CommentThread comments={mockComments} />
      </div>
    </div>
  );
};

export default PostPage;
