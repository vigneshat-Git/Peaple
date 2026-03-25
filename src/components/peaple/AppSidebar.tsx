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

  const uniqueCommunities = Array.from(
    new Map(topCommunities.map(c => [c.id, c])).values()
  );

  const navItems = [
    ...baseNavItems,
    ...(user ? [{ label: "Profile", icon: User, path: `/user/${user.username}` }] : []),
  ];

  return (
    <div className="h-full overflow-y-auto py-2 pr-2 space-y-6">
      {/* Navigation Card */}
      <nav className="bg-card rounded-lg border shadow-sm p-2 space-y-1">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Top Communities Card */}
      <div className="bg-card rounded-lg border shadow-sm p-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          Top Communities
        </h4>
        <div className="space-y-1">
          {uniqueCommunities.map((community, index) => (
            <CommunityCard 
              key={`${community.id}-${index}`} 
              id={community.id} 
              name={community.name} 
              members={community.members} 
            />
          ))}
        </div>
        <Link 
          to="/communities" 
          className="block text-center text-xs text-primary hover:underline mt-3 pt-2 border-t"
        >
          View All Communities
        </Link>
      </div>

      {/* Footer Links */}
      <div className="px-2 text-xs text-muted-foreground space-y-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </div>
        <p className="text-[10px]">© 2026 Peaple. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AppSidebar;
