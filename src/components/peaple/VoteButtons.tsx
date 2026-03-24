import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { apiService } from "@/lib/api";

interface VoteButtonsProps {
  initialVotes: number;
  initialUserVote?: "up" | "down" | null;
  postId?: string;
  commentId?: string;
  direction?: "vertical" | "horizontal";
  onVoteChange?: (newVotes: number, userVote: "up" | "down" | null) => void;
}

const VoteButtons = ({ 
  initialVotes, 
  initialUserVote = null,
  postId,
  commentId,
  direction = "vertical",
  onVoteChange
}: VoteButtonsProps) => {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(initialUserVote);
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async (type: "up" | "down") => {
    if (isLoading || (!postId && !commentId)) return;

    setIsLoading(true);
    
    try {
      const value = type === "up" ? 1 : -1;
      
      // If user is clicking the same vote, remove it
      if (userVote === type) {
        await apiService.post('/votes', {
          postId,
          commentId,
          value
        });
        // This will toggle off the vote (backend handles this logic)
        setVotes(prev => userVote === "up" ? prev - 1 : prev + 1);
        setUserVote(null);
        onVoteChange?.(votes - (type === "up" ? 1 : -1), null);
      } else {
        // If changing vote or adding new vote
        let voteChange = value;
        if (userVote === "up") voteChange = -2; // Changing from up to down
        else if (userVote === "down") voteChange = 2; // Changing from down to up
        
        await apiService.post('/votes', {
          postId,
          commentId,
          value
        });
        
        setVotes(prev => prev + voteChange);
        setUserVote(type);
        onVoteChange?.(votes + voteChange, type);
      }
    } catch (error) {
      console.error('Vote failed:', error);
      // Revert on error
      setVotes(initialVotes);
      setUserVote(initialUserVote);
    } finally {
      setIsLoading(false);
    }
  };

  const isVertical = direction === "vertical";

  return (
    <div className={`flex ${isVertical ? "flex-col" : "flex-row"} items-center gap-0.5`}>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => handleVote("up")}
        disabled={isLoading}
        className={`p-1 rounded-md transition-colors ${
          userVote === "up"
            ? "text-primary bg-primary-light"
            : "text-muted-foreground hover:text-primary hover:bg-primary-light"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <ChevronUp className="h-5 w-5" />
      </motion.button>
      <span className={`text-sm font-semibold ${userVote === "up" ? "text-primary" : userVote === "down" ? "text-destructive" : "text-foreground"}`}>
        {votes}
      </span>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => handleVote("down")}
        disabled={isLoading}
        className={`p-1 rounded-md transition-colors ${
          userVote === "down"
            ? "text-destructive bg-destructive/10"
            : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <ChevronDown className="h-5 w-5" />
      </motion.button>
    </div>
  );
};

export default VoteButtons;
