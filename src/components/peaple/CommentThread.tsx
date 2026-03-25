import { useState } from "react";
import { MessageSquare } from "lucide-react";
import VoteButtons from "./VoteButtons";

export interface CommentData {
  id: string;
  author: string;
  content: string;
  votes: number;
  timeAgo: string;
  replies?: CommentData[];
}

const Comment = ({ comment, depth = 0 }: { comment: CommentData; depth?: number }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showReply, setShowReply] = useState(false);

  return (
    <div className={`${depth > 0 ? "ml-4 pl-4 border-l-2 border-border" : ""}`}>
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-foreground">{comment.author}</span>
          <span className="text-xs text-muted-foreground">· {comment.timeAgo}</span>
          {comment.replies && comment.replies.length > 0 && (
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              [{collapsed ? "+" : "−"}]
            </button>
          )}
        </div>
        {!collapsed && (
          <>
            <p className="text-sm text-foreground mb-2 leading-relaxed">{comment.content}</p>
            <div className="flex items-center gap-3">
              <VoteButtons initialVotes={comment.votes} direction="horizontal" />
              <button
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1 text-xs text-muted-foreground font-medium hover:text-foreground transition-colors duration-150"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>
            </div>
            {showReply && (
              <div className="mt-2">
                <textarea
                  placeholder="Write a reply..."
                  className="w-full p-2 text-sm border rounded-md bg-card text-foreground resize-none focus:outline-none focus:border-primary transition-colors duration-150"
                  rows={2}
                />
                <div className="flex justify-end gap-2 mt-1.5">
                  <button 
                    onClick={() => setShowReply(false)}
                    className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity duration-150">
                    Reply
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {!collapsed && comment.replies?.map(reply => (
        <Comment key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );
};

const CommentThread = ({ comments }: { comments: CommentData[] }) => {
  return (
    <div className="space-y-0">
      {comments.map(comment => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export default CommentThread;
