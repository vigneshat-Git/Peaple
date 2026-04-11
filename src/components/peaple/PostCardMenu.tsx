import { useState } from "react";
import { MoreHorizontal, UserPlus, EyeOff, Flag, Share2, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface PostCardMenuProps {
  postId: string;
  authorUsername: string;
}

const PostCardMenu = ({ postId, authorUsername }: PostCardMenuProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isOwnPost = user?.username === authorUsername;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAction = (action: string) => {
    toast({ title: action, description: `Action "${action}" triggered for post.` });
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await apiService.deletePost(postId);
      toast({ 
        title: "Post deleted", 
        description: "Your post has been deleted successfully." 
      });
      // If on post detail page, navigate back
      if (window.location.pathname.includes(`/post/${postId}`)) {
        navigate(-1);
      } else {
        // Refresh the page to remove the deleted post from feed
        window.location.reload();
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
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
              onClick={handleDeleteClick}
              className="cursor-pointer text-destructive focus:text-destructive"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {isDeleting ? "Deleting..." : "Delete post"}
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

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this post? This action cannot be undone.
            {isDeleting && " Deleting..."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default PostCardMenu;
