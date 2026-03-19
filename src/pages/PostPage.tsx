import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import VoteButtons from "@/components/peaple/VoteButtons";
import UserAvatar from "@/components/peaple/UserAvatar";
import CommentThread, { CommentData } from "@/components/peaple/CommentThread";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Share2 } from "lucide-react";
import { apiService } from "@/lib/api";

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  community_id: string;
  media_url?: string;
  score: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  // Nested objects from API
  author?: {
    id: string;
    username: string;
  };
  community?: {
    id: string;
    name: string;
  };
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  parent_comment_id?: string | null;
  created_at: string;
  updated_at?: string;
  votes_count?: number;
  score?: number;
  replies?: Comment[];
  children?: Comment[]; // Added for tree structure
}

// Helper function for formatting time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

// CommentVotes component for upvote/downvote functionality
const CommentVotes = ({ 
  votes, 
  onUpvote, 
  onDownvote 
}: { 
  votes: number; 
  onUpvote?: () => void; 
  onDownvote?: () => void;
}) => {
  return (
    <div className="flex flex-col items-center mr-3 text-muted-foreground">
      <button 
        onClick={onUpvote} 
        className="hover:text-primary transition-colors p-1"
        aria-label="Upvote"
      >
        ▲
      </button>
      <span className="text-xs font-medium">{votes}</span>
      <button 
        onClick={onDownvote} 
        className="hover:text-red-500 transition-colors p-1"
        aria-label="Downvote"
      >
        ▼
      </button>
    </div>
  );
};

// Recursive CommentItem component for nested comments
const CommentItem = ({ 
  comment, 
  depth = 0, 
  onReply 
}: { 
  comment: Comment; 
  depth?: number; 
  onReply: (parentId: string, content: string) => void;
}) => {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const maxDepth = 5; // Prevent infinite nesting

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText.trim());
      setReplyText("");
      setShowReply(false);
    }
  };

  const votes = comment.votes_count || comment.score || 0;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-border pl-3' : ''} mb-4`}>
      <div className="flex gap-3">
        
        {/* Vote Buttons */}
        <CommentVotes votes={votes} />

        {/* Comment Content */}
        <div className="flex-1 bg-card border rounded-lg p-3 hover:bg-muted/50 transition-colors">
          
          {/* Author and Time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-medium text-foreground">
              {comment.author?.username || `User ${comment.author_id?.substring(0, 8)}`}
            </span>
            <span>•</span>
            <span>{formatTime(comment.created_at)}</span>
          </div>

          {/* Comment Text */}
          <p className="text-sm text-foreground mb-2 leading-relaxed">
            {comment.content}
          </p>

          {/* Reply Button */}
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-xs text-primary hover:underline transition-colors cursor-pointer"
          >
            Reply
          </button>

          {/* Reply Form */}
          {showReply && depth < maxDepth && (
            <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 text-sm rounded bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleReplySubmit}
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setShowReply(false);
                    setReplyText("");
                  }}
                  className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.children && comment.children.length > 0 && depth < maxDepth && (
        <div className="mt-3">
          {comment.children.map(child => (
            <CommentItem 
              key={child.id} 
              comment={child} 
              depth={depth + 1} 
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = async () => {
    if (!id) return;
    
    try {
      const response = await apiService.getPost(id);
      const postData = response.data?.data || response.data;
      
      if (!postData) {
        setError('Post not found');
        return;
      }
      
      setPost(postData);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    
    try {
      const response = await apiService.getPostComments(id);
      // Handle monolithic backend response format: {success: true, data: [...]}
      const commentsData = response.data?.data || response.data?.value || response.data || [];
      setComments(commentsData);
    } catch (err) {
      console.error('Error fetching comments:', err);
      // Don't set error for comments, just leave empty
    }
  };

  const handleCommentSubmit = async (parentId?: string, content?: string) => {
    const commentContent = content || commentText;
    const parentCommentId = parentId || undefined;
    
    if (!id || !commentContent.trim()) return;
    
    try {
      await apiService.createComment({
        postId: id,
        content: commentContent.trim(),
        parentId: parentCommentId
      });
      
      if (!parentId) {
        setCommentText(""); // Only clear main comment input
      }
      await fetchComments(); // Refetch comments
    } catch (err) {
      console.error('Error submitting comment:', err);
      // You could show a toast notification here
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPost(), fetchComments()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [id]);

  if (isLoading) {
    return <div className="max-w-3xl p-6">Loading...</div>;
  }

  if (error || !post) {
    return <div className="max-w-3xl p-6">{error || 'Post not found'}</div>;
  }

  // Build comment tree from flat comments array
  const buildCommentTree = (flatComments: Comment[]): Comment[] => {
    const commentMap: { [key: string]: Comment } = {};
    const roots: Comment[] = [];

    // Create a map of all comments
    flatComments.forEach(comment => {
      commentMap[comment.id] = { ...comment, children: [] };
    });

    // Build the tree structure
    flatComments.forEach(comment => {
      const commentWithChildren = commentMap[comment.id];
      if (comment.parent_comment_id) {
        const parent = commentMap[comment.parent_comment_id];
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(commentWithChildren);
        }
      } else {
        roots.push(commentWithChildren);
      }
    });

    return roots;
  };

  const commentTree = buildCommentTree(comments);

  return (
    <div className="max-w-3xl">
      <div className="bg-card rounded-lg border p-6 mb-4">
        <div className="flex gap-4">
          <VoteButtons initialVotes={post.upvotes} />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">c/{post.community?.name || post.community_id}</span>
              <span>•</span>
              <span>Posted by {post.author?.username || post.author_id}</span>
              <span>•</span>
              <span>{formatTime(post.created_at)}</span>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-4">
              {post.title}
            </h1>
            <div className="prose prose-sm text-foreground max-w-none mb-4">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Bookmark className="h-4 w-4" /> Save
              </button>
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add comment */}
      <div className="bg-card rounded-lg border p-4 mb-4">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="What are your thoughts?"
          className="w-full p-3 text-sm rounded-lg bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button 
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            onClick={() => handleCommentSubmit()}
            disabled={!commentText.trim()}
          >
            Comment
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h3>
        
        {commentTree.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {commentTree.map(comment => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                onReply={handleCommentSubmit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostPage;
