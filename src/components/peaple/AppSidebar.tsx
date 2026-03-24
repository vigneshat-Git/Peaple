import { Home, TrendingUp, Users, PlusCircle, Bookmark, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import CommunityCard from "./CommunityCard";
import { useAuth } from "@/contexts/AuthContext";

const baseNavItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Popular", icon: TrendingUp, path: "/popular" },
  { label: "Create Community", icon: PlusCircle, path: "/create-community" },
  { label: "Saved Posts", icon: Bookmark, path: "/saved" },
];

const topCommunities = [
  { id: "40f741f9-c92f-4e4c-b32b-bb6868414aff", name: "webdev", members: 42800 },
  { id: "6e93fc5e-bdba-4d97-bca0-6306cfdea90a", name: "startups", members: 31200 },
  { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "design", members: 28400 },
  { id: "b2c3d4e5-f6a7-8901-bcde-f23456789012", name: "trading", members: 19700 },
];

const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Deduplicate communities by ID
  const uniqueCommunities = Array.from(
    new Map(topCommunities.map(c => [c.id, c])).values()
  );

  const navItems = [
    ...baseNavItems,
    ...(user ? [{ label: "Profile", icon: User, path: `/user/${user.username}` }] : []),
  ];

  return (
    <aside className="w-60 shrink-0 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pr-2">
      <nav className="space-y-1 mb-6">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "nav-item-active"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Top Communities
        </h4>
        {uniqueCommunities.map((community, index) => (
          <CommunityCard 
            key={`${community.id}-${index}`} 
            id={community.id} 
            name={community.name} 
            members={community.members} 
          />
        ))}
      </div>
    </aside>
  );
};

export default AppSidebar;

