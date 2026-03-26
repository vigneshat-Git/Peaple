import { MoreHorizontal, UserPlus, EyeOff, Flag, Share2, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PostCardMenuProps {
  postId: string;
  authorUsername: string;
}

const PostCardMenu = ({ postId, authorUsername }: PostCardMenuProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwnPost = user?.username === authorUsername;

  const handleAction = (action: string) => {
    toast({ title: action, description: `Action "${action}" triggered for post.` });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150 focus:outline-none"
          onClick={(e) => e.preventDefault()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {isOwnPost ? (
          <>
            <DropdownMenuItem onClick={() => handleAction("Edit post")} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" /> Edit post
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAction("Delete post")}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete post
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("Share post")} className="cursor-pointer">
              <Share2 className="mr-2 h-4 w-4" /> Share post
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => handleAction("Follow user")} className="cursor-pointer">
              <UserPlus className="mr-2 h-4 w-4" /> Follow u/{authorUsername}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("Hide post")} className="cursor-pointer">
              <EyeOff className="mr-2 h-4 w-4" /> Hide post
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("Report post")} className="cursor-pointer">
              <Flag className="mr-2 h-4 w-4" /> Report post
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("Share post")} className="cursor-pointer">
              <Share2 className="mr-2 h-4 w-4" /> Share post
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostCardMenu;
