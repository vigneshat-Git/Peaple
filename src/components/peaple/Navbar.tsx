import { Search, Bell, Plus, Compass, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import UserDropdown from "./UserDropdown";

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-card border-b h-14">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4 flex-1">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {/* Mobile logo - shown on small screens */}
            <img 
              src="/mobile-logo.svg" 
              alt="Peaple" 
              className="h-8 w-auto sm:hidden"
            />
            {/* Desktop logo - hidden on small screens */}
            <img 
              src="/header-logo.svg" 
              alt="Peaple" 
              className="h-8 w-auto hidden sm:block"
            />
          </Link>

          <div className="relative max-w-md w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Peaple"
              className="w-full h-9 pl-9 pr-4 rounded-md bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            to="/popular"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
          >
            <Flame className="h-4 w-4" />
            <span className="hidden lg:inline">Popular</span>
          </Link>

          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
          >
            <Compass className="h-4 w-4" />
            <span className="hidden lg:inline">Explore</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/create-post">
                <Button size="sm" className="gap-1.5 text-xs font-medium h-8">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create</span>
                </Button>
              </Link>
              <button className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              </button>
              <UserDropdown username={user?.username || "User"} avatarUrl={user?.avatar} />
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-sm h-8">
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="text-xs font-medium h-8">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
