import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, Bookmark, Users } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserDropdownProps {
  username: string;
  avatarUrl?: string;
}

const UserDropdown = ({ username, avatarUrl }: UserDropdownProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Signed out", description: "You have been successfully logged out." });
      navigate("/login");
    } catch (error) {
      toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none rounded-full">
          <UserAvatar name={username} image={avatarUrl} size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{username}</p>
            <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`/user/${username}`} className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/saved" className="flex items-center cursor-pointer">
            <Bookmark className="mr-2 h-4 w-4" /> Saved Posts
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/create-community" className="flex items-center cursor-pointer">
            <Users className="mr-2 h-4 w-4" /> Create Community
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center cursor-pointer">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
