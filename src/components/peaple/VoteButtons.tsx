import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
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
      
      if (userVote === type) {
        await apiService.post('/votes', { postId, commentId, value });
        setVotes(prev => userVote === "up" ? prev - 1 : prev + 1);
        setUserVote(null);
        onVoteChange?.(votes - (type === "up" ? 1 : -1), null);
      } else {
        let voteChange = value;
        if (userVote === "up") voteChange = -2;
        else if (userVote === "down") voteChange = 2;
        
        await apiService.post('/votes', { postId, commentId, value });
        
        setVotes(prev => prev + voteChange);
        setUserVote(type);
        onVoteChange?.(votes + voteChange, type);
      }
    } catch (error) {
      console.error('Vote failed:', error);
      setVotes(initialVotes);
      setUserVote(initialUserVote);
    } finally {
      setIsLoading(false);
    }
  };

  const isVertical = direction === "vertical";

  return (
    <div className={`flex ${isVertical ? "flex-col" : "flex-row"} items-center gap-0`}>
      <button
        onClick={() => handleVote("up")}
        disabled={isLoading}
        className={`p-0.5 rounded-sm transition-colors duration-150 ${
          userVote === "up"
            ? "text-primary"
            : "text-muted-foreground hover:text-primary"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <span className={`text-xs font-bold ${userVote === "up" ? "text-primary" : userVote === "down" ? "text-destructive" : "text-foreground"}`}>
        {votes}
      </span>
      <button
        onClick={() => handleVote("down")}
        disabled={isLoading}
        className={`p-0.5 rounded-sm transition-colors duration-150 ${
          userVote === "down"
            ? "text-destructive"
            : "text-muted-foreground hover:text-destructive"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
};

export default VoteButtons;
