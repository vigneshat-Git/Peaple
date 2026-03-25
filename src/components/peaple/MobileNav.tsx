import { Home, TrendingUp, PlusCircle, Bookmark, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const items = [
  { icon: Home, path: "/", label: "Home" },
  { icon: TrendingUp, path: "/popular", label: "Popular" },
  { icon: PlusCircle, path: "/create-post", label: "Post" },
  { icon: Bookmark, path: "/saved", label: "Saved" },
  { icon: User, path: "/user/johndoe", label: "Profile" },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t lg:hidden">
      <div className="flex items-center justify-around h-12">
        {items.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors duration-150 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
