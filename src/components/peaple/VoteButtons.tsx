import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

interface VoteButtonsProps {
  initialVotes: number;
  direction?: "vertical" | "horizontal";
}

const VoteButtons = ({ initialVotes, direction = "vertical" }: VoteButtonsProps) => {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);

  const handleVote = (type: "up" | "down") => {
    if (userVote === type) {
      setVotes(initialVotes);
      setUserVote(null);
    } else {
      setVotes(initialVotes + (type === "up" ? 1 : -1));
      setUserVote(type);
    }
  };

  const isVertical = direction === "vertical";

  return (
    <div className={`flex ${isVertical ? "flex-col" : "flex-row"} items-center gap-0.5`}>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => handleVote("up")}
        className={`p-1 rounded-md transition-colors ${
          userVote === "up"
            ? "text-primary bg-primary-light"
            : "text-muted-foreground hover:text-primary hover:bg-primary-light"
        }`}
      >
        <ChevronUp className="h-5 w-5" />
      </motion.button>
      <span className={`text-sm font-semibold ${userVote === "up" ? "text-primary" : userVote === "down" ? "text-destructive" : "text-foreground"}`}>
        {votes}
      </span>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => handleVote("down")}
        className={`p-1 rounded-md transition-colors ${
          userVote === "down"
            ? "text-destructive bg-destructive/10"
            : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        }`}
      >
        <ChevronDown className="h-5 w-5" />
      </motion.button>
    </div>
  );
};

export default VoteButtons;
