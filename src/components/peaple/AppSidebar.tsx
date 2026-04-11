import { Home, TrendingUp, Users, PlusCircle, Bookmark, User, Settings, Loader2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import CommunityCard from "./CommunityCard";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { apiService } from "@/lib/api";

const baseNavItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Popular", icon: TrendingUp, path: "/popular" },
  { label: "Create Community", icon: PlusCircle, path: "/create-community" },
  { label: "Saved Posts", icon: Bookmark, path: "/saved" },
];

interface Community {
  id: string;
  name: string;
  member_count: number;
}

const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [topCommunities, setTopCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopCommunities = async () => {
      try {
        setLoading(true);
        const response = await apiService.getTopCommunities(5);
        const data = (response as any).data || response || [];
        setTopCommunities(data);
      } catch (error) {
        console.error("Failed to fetch top communities:", error);
        setTopCommunities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTopCommunities();
  }, []);

  const navItems = [
    ...baseNavItems,
    ...(user ? [
      { label: "Profile", icon: User, path: `/user/${user.username}` },
      { label: "Settings", icon: Settings, path: "/settings" },
    ] : []),
  ];

  return (
    <aside className="hidden lg:block sticky top-[3.5rem] h-[calc(100vh-3.5rem)] overflow-y-auto py-4">
      <nav className="space-y-0.5 mb-6">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                active
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t pt-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Top Communities
        </h4>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : topCommunities.length > 0 ? (
          topCommunities.map((community, index) => (
            <CommunityCard 
              key={`${community.id}-${index}`} 
              id={community.id} 
              name={community.name} 
              members={community.member_count} 
            />
          ))
        ) : (
          <p className="text-xs text-muted-foreground px-3 py-2">No communities yet</p>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
