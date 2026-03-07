import PostCard, { PostData } from "@/components/peaple/PostCard";

const mockPosts: PostData[] = [
  {
    id: "1",
    title: "Why Server Components are the future of React",
    content: "After spending 6 months building with RSC in production, here's what I've learned about performance, DX, and the tradeoffs you need to consider...",
    author: "sarah_dev",
    community: "webdev",
    votes: 342,
    comments: 89,
    tags: ["react", "server-components", "performance"],
    timeAgo: "3h ago",
  },
  {
    id: "2",
    title: "I bootstrapped my SaaS to $10k MRR — here's my playbook",
    content: "No VC money, no co-founder. Just a laptop, determination, and a lot of cold outreach. Here's exactly how I did it step by step...",
    author: "indie_alex",
    community: "startups",
    votes: 567,
    comments: 134,
    tags: ["bootstrapping", "saas", "growth"],
    timeAgo: "5h ago",
  },
  {
    id: "3",
    title: "The design system that scaled our team from 5 to 50",
    content: "When we started, everyone styled components differently. Here's how we built a design system that brought consistency and sped up development by 3x...",
    author: "jordan_ux",
    community: "design",
    votes: 218,
    comments: 42,
    tags: ["design-systems", "ui", "scaling"],
    timeAgo: "8h ago",
  },
  {
    id: "4",
    title: "Understanding market cycles: A quantitative approach",
    content: "Using historical data from the past 50 years, I've identified patterns that repeat with surprising consistency. Here's my analysis framework...",
    author: "quant_trader",
    community: "trading",
    votes: 445,
    comments: 97,
    tags: ["markets", "analysis", "data"],
    timeAgo: "12h ago",
  },
  {
    id: "5",
    title: "TypeScript 6.0 features you need to know about",
    content: "The latest TypeScript release brings pattern matching, pipe operator support, and improved type inference. Let me walk you through the highlights...",
    author: "ts_guru",
    community: "webdev",
    votes: 289,
    comments: 63,
    tags: ["typescript", "javascript", "programming"],
    timeAgo: "1d ago",
  },
];

const sortOptions = ["Hot", "New", "Top"];

const HomePage = () => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {sortOptions.map((opt, i) => (
          <button
            key={opt}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              i === 0
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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

export default HomePage;
