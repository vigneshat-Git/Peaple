import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import VoteButtons from "@/components/peaple/VoteButtons";
import { Bookmark, Share2, MessageSquare } from "lucide-react";
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
  author?: { id: string; username: string };
  community?: { id: string; name: string };
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author?: { id: string; username: string; avatar_url?: string };
  parent_comment_id?: string | null;
  created_at: string;
  votes_count?: number;
  score?: number;
  children?: Comment[];
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) return `${Math.floor((now.getTime() - date.getTime()) / (1000 * 60))}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

const CommentItem = ({ comment, depth = 0, onReply }: { comment: Comment; depth?: number; onReply: (parentId: string, content: string) => void }) => {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const maxDepth = 5;
  const votes = comment.votes_count || comment.score || 0;

  const handleReplySubmit = () => {
    if (replyText.trim()) { onReply(comment.id, replyText.trim()); setReplyText(""); setShowReply(false); }
  };

  return (
    <div className={`${depth > 0 ? 'ml-4 border-l-2 border-border pl-3' : ''} mb-2`}>
      <div className="py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span className="font-semibold text-foreground">
            {comment.author?.username || `User ${comment.author_id?.substring(0, 8)}`}
          </span>
          <span>·</span>
          <span>{formatTime(comment.created_at)}</span>
        </div>
        <p className="text-sm text-foreground mb-2 leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <VoteButtons initialVotes={votes} commentId={comment.id} direction="horizontal" />
          <button onClick={() => setShowReply(!showReply)} className="font-medium hover:text-foreground transition-colors duration-150">
            Reply
          </button>
        </div>
        {showReply && depth < maxDepth && (
          <div className="mt-2">
            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..."
              className="w-full p-2 text-sm rounded-md bg-card text-foreground border focus:outline-none focus:border-primary transition-colors duration-150 resize-none" rows={2} />
            <div className="flex gap-2 mt-1.5 justify-end">
              <button onClick={() => { setShowReply(false); setReplyText(""); }}
                className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md transition-colors duration-150">Cancel</button>
              <button onClick={handleReplySubmit}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity duration-150">Reply</button>
            </div>
          </div>
        )}
      </div>
      {comment.children && comment.children.length > 0 && depth < maxDepth && (
        <div>{comment.children.map(child => <CommentItem key={child.id} comment={child} depth={depth + 1} onReply={onReply} />)}</div>
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
      const response: any = await apiService.getPost(id);
      const postData = response?.data?.data || response?.data || response;
      if (!postData) { setError('Post not found'); return; }
      setPost(postData);
    } catch (err) { setError('Failed to load post'); }
  };

  const fetchComments = async () => {
    if (!id) return;
    try {
      const response: any = await apiService.getPostComments(id);
      const commentsData = response?.data?.data || response?.data?.value || response?.data || [];
      setComments(commentsData);
    } catch (err) { console.error('Error fetching comments:', err); }
  };

  const handleCommentSubmit = async (parentId?: string, content?: string) => {
    const commentContent = content || commentText;
    if (!id || !commentContent.trim()) return;
    try {
      await apiService.createComment({ postId: id, content: commentContent.trim(), parentCommentId: parentId });
      if (!parentId) setCommentText("");
      await fetchComments();
    } catch (err) { console.error('Error submitting comment:', err); }
  };

  useEffect(() => {
    const loadData = async () => { setIsLoading(true); await Promise.all([fetchPost(), fetchComments()]); setIsLoading(false); };
    loadData();
  }, [id]);

  if (isLoading) return <div className="max-w-3xl py-6 text-sm text-muted-foreground">Loading...</div>;
  if (error || !post) return <div className="max-w-3xl py-6 text-sm text-destructive">{error || 'Post not found'}</div>;

  const buildCommentTree = (flatComments: Comment[]): Comment[] => {
    const map: { [key: string]: Comment } = {};
    const roots: Comment[] = [];
    flatComments.forEach(c => { map[c.id] = { ...c, children: [] }; });
    flatComments.forEach(c => {
      const node = map[c.id];
      if (c.parent_comment_id && map[c.parent_comment_id]) { map[c.parent_comment_id].children!.push(node); }
      else { roots.push(node); }
    });
    return roots;
  };

  const commentTree = buildCommentTree(comments);

  return (
    <div className="max-w-3xl">
      <div className="bg-card rounded-md border p-4 mb-3">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <VoteButtons initialVotes={post.upvotes} postId={post.id}
              onVoteChange={(newVotes) => setPost(prev => prev ? { ...prev, upvotes: newVotes, score: newVotes.toString() } : null)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">c/{post.community?.name || post.community_id}</span>
              <span>·</span>
              <span>Posted by u/{post.author?.username || post.author_id}</span>
              <span>·</span>
              <span>{formatTime(post.created_at)}</span>
            </div>
            <h1 className="text-lg font-bold text-foreground mb-3">{post.title}</h1>
            <div className="text-sm text-foreground mb-4 leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />{comments.length} Comments</span>
              <button className="flex items-center gap-1.5 hover:text-foreground transition-colors duration-150"><Share2 className="h-4 w-4" />Share</button>
              <button className="flex items-center gap-1.5 hover:text-foreground transition-colors duration-150"><Bookmark className="h-4 w-4" />Save</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-md border p-4 mb-3">
        <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="What are your thoughts?"
          className="w-full p-3 text-sm rounded-md bg-background text-foreground border focus:outline-none focus:border-primary transition-colors duration-150 resize-none" rows={3} />
        <div className="flex justify-end mt-2">
          <button className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
            onClick={() => handleCommentSubmit()} disabled={!commentText.trim()}>Comment</button>
        </div>
      </div>

      <div className="bg-card rounded-md border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</h3>
        {commentTree.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first to comment!</p>
        ) : (
          <div>{commentTree.map(comment => <CommentItem key={comment.id} comment={comment} onReply={handleCommentSubmit} />)}</div>
        )}
      </div>
    </div>
  );
};

export default PostPage;
