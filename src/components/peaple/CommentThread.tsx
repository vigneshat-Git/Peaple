import { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import VoteButtons from "./VoteButtons";
import UserAvatar from "./UserAvatar";

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
    <div className={`${depth > 0 ? "ml-6 pl-4 border-l-2 border-border" : ""}`}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <UserAvatar name={comment.author} size="sm" />
          <span className="text-sm font-medium text-foreground">{comment.author}</span>
          <span className="text-xs text-muted-foreground">{comment.timeAgo}</span>
          {comment.replies && comment.replies.length > 0 && (
            <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground">
              {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
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
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>
            </div>
            {showReply && (
              <div className="mt-3">
                <textarea
                  placeholder="Write a reply..."
                  className="w-full p-2.5 text-sm border rounded-lg bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-dark transition-colors">
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
