import { TrendingUp, Users, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import UserAvatar from "./UserAvatar";

const trendingTopics = [
  { title: "React Server Components in 2026", community: "webdev", comments: 234 },
  { title: "Is AI replacing junior devs?", community: "startups", comments: 189 },
  { title: "Best design systems for SaaS", community: "design", comments: 156 },
  { title: "Bitcoin hits new ATH", community: "trading", comments: 312 },
];

const suggestedCommunities = [
  { name: "typescript", members: 15400 },
  { name: "ux", members: 12100 },
  { name: "indie-hackers", members: 8900 },
];

const activeUsers = [
  { name: "Sarah Chen", reputation: 12400 },
  { name: "Alex Rivera", reputation: 9800 },
  { name: "Jordan Kim", reputation: 8200 },
];

const DiscoverPanel = () => {
  return (
    <aside className="w-72 shrink-0 hidden xl:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pl-2 space-y-5">
      {/* Trending */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Trending</h3>
        </div>
        <div className="space-y-3">
          {trendingTopics.map((topic, i) => (
            <div key={i} className="group cursor-pointer">
              <p className="text-sm text-foreground group-hover:text-primary transition-colors leading-snug font-medium">
                {topic.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                c/{topic.community} · {topic.comments} comments
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Communities */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Suggested</h3>
        </div>
        <div className="space-y-2">
          {suggestedCommunities.map(c => (
            <Link
              key={c.name}
              to={`/c/${c.name}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary-light flex items-center justify-center text-primary-dark font-bold text-xs">
                  {c.name[0].toUpperCase()}
                </div>
                <span className="text-sm text-foreground">c/{c.name}</span>
              </div>
              <button className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
                Join
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Top Contributors</h3>
        </div>
        <div className="space-y-2.5">
          {activeUsers.map((user, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <UserAvatar name={user.name} size="sm" />
              <div>
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.reputation.toLocaleString()} rep</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default DiscoverPanel;
