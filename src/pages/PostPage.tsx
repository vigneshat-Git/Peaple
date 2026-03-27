import { MessageSquare, Share2, Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VoteButtons from "@/components/peaple/VoteButtons";
import CommentSkeleton from "@/components/peaple/CommentSkeleton";
import { apiService } from "@/lib/api";

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  community_id: string;
  media?: Array<{ id: string; url: string; type: string; file_name?: string }>;
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
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
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
  const [collapsed, setCollapsed] = useState(false);
  const maxDepth = 5;
  const votes = comment.votes_count || comment.score || 0;
  const hasChildren = comment.children && comment.children.length > 0;

  const handleReplySubmit = () => {
    if (replyText.trim()) { onReply(comment.id, replyText.trim()); setReplyText(""); setShowReply(false); }
  };

  // Responsive indentation classes - mobile: 12px per level, desktop: 20px per level
  const indentClass = depth === 0 ? '' : 
    depth === 1 ? 'ml-3 sm:ml-5' : 
    depth === 2 ? 'ml-6 sm:ml-10' : 
    depth === 3 ? 'ml-8 sm:ml-14' : 
    'ml-10 sm:ml-16';

  const paddingClass = depth === 0 ? '' : 'pl-2 sm:pl-3';

  return (
    <div className={`${indentClass} ${paddingClass} ${depth > 0 ? 'border-l-2 border-border/60' : ''} mb-1`}>
      <div className="py-2 hover:bg-accent/30 rounded-sm px-2 -mx-2 transition-colors">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {comment.author?.avatar ? (
            <img src={comment.author.avatar} alt={comment.author.username} className="w-5 h-5 rounded-full" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              {(comment.author?.username || 'U')[0].toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-foreground hover:underline cursor-pointer">
            {comment.author?.username || `unknown_user`}
          </span>
          <span>·</span>
          <span>{formatTime(comment.created_at)}</span>
          {hasChildren && (
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium ml-1"
            >
              [{collapsed ? `+${comment.children?.length}` : '−'}]
            </button>
          )}
        </div>
        {!collapsed && (
          <>
            <p className="text-sm text-foreground mb-2 leading-relaxed">{comment.content}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <VoteButtons initialVotes={votes} commentId={comment.id} direction="horizontal" />
              {depth < maxDepth && (
                <button onClick={() => setShowReply(!showReply)} className="font-medium hover:text-foreground transition-colors duration-150">
                  Reply
                </button>
              )}
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
          </>
        )}
      </div>
      {!collapsed && hasChildren && depth < maxDepth && (
        <div className="mt-1">{comment.children?.map(child => <CommentItem key={child.id} comment={child} depth={depth + 1} onReply={onReply} />)}</div>
      )}
      {!collapsed && hasChildren && depth >= maxDepth && (
        <div className="mt-1 text-xs text-muted-foreground italic">
          <a href={`#comment-${comment.children?.[0].id}`} className="hover:text-foreground">Continue thread →</a>
        </div>
      )}
    </div>
  );
};

const PostPageSkeleton = () => (
  <div className="max-w-3xl animate-pulse">
    {/* Post Skeleton */}
    <div className="bg-card rounded-md border p-4 mb-3">
      <div className="flex gap-3">
        {/* Vote buttons */}
        <div className="flex-shrink-0 w-10 flex flex-col items-center gap-1">
          <div className="w-6 h-6 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-6"></div>
          <div className="w-6 h-6 bg-muted rounded"></div>
        </div>
        <div className="flex-1 space-y-3">
          {/* Header: Community, Author, Time */}
          <div className="flex items-center gap-1.5">
            <div className="h-3 bg-muted rounded w-16"></div>
            <div className="h-3 bg-muted rounded w-1"></div>
            <div className="h-3 bg-muted rounded w-20"></div>
            <div className="h-3 bg-muted rounded w-1"></div>
            <div className="h-3 bg-muted rounded w-12"></div>
          </div>
          {/* Title */}
          <div className="h-6 bg-muted rounded w-3/4"></div>
          {/* Content */}
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded w-full"></div>
            <div className="h-3 bg-muted rounded w-5/6"></div>
            <div className="h-3 bg-muted rounded w-4/5"></div>
          </div>
          {/* Media placeholder */}
          <div className="w-full h-48 bg-muted rounded-md max-w-md"></div>
          {/* Footer */}
          <div className="flex items-center gap-3">
            <div className="h-4 bg-muted rounded w-20"></div>
            <div className="h-4 bg-muted rounded w-12"></div>
            <div className="h-4 bg-muted rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Comment input skeleton */}
    <div className="bg-card rounded-md border p-4 mb-3">
      <div className="h-20 bg-muted rounded-md mb-2"></div>
      <div className="flex justify-end">
        <div className="h-8 bg-muted rounded w-20"></div>
      </div>
    </div>

    {/* Comments section skeleton */}
    <div className="bg-card rounded-md border p-4">
      <div className="h-4 bg-muted rounded w-24 mb-3"></div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <CommentSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

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
      console.log('Raw comments response:', response);
      // API returns { success: true, data: [...], pagination: {...} }
      const commentsData = response?.data || [];
      console.log('Extracted comments:', commentsData);
      console.log('Sample comment:', commentsData[0]);
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

  if (isLoading) return <PostPageSkeleton />;
  if (error || !post) return <div className="max-w-3xl py-6 text-sm text-destructive">{error || 'Post not found'}</div>;

  const buildCommentTree = (flatComments: Comment[]): Comment[] => {
    console.log('Building tree from:', flatComments.length, 'comments');
    const map: { [key: string]: Comment } = {};
    const roots: Comment[] = [];
    flatComments.forEach(c => { 
      map[c.id] = { ...c, children: [] }; 
      console.log('Comment:', c.id, 'parent:', c.parent_comment_id);
    });
    flatComments.forEach(c => {
      const node = map[c.id];
      if (c.parent_comment_id && map[c.parent_comment_id]) { 
        console.log('Adding child', c.id, 'to parent', c.parent_comment_id);
        map[c.parent_comment_id].children!.push(node); 
      }
      else { 
        console.log('Root comment:', c.id);
        roots.push(node); 
      }
    });
    console.log('Tree roots:', roots.length);
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
            {post.media && post.media.length > 0 && (
              <div className="mb-4">
                {post.media.length === 1 ? (
                  <div className="max-w-md">
                    {post.media[0].type === 'image' ? (
                      <img src={post.media[0].url} alt={post.media[0].file_name || 'Image'} className="w-full rounded border" />
                    ) : (
                      <video src={post.media[0].url} controls preload="metadata" className="w-full rounded border" />
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-w-md">
                    {post.media.map((media) => (
                      <div key={media.id}>
                        {media.type === 'image' ? (
                          <img src={media.url} alt={media.file_name || 'Image'} className="w-full h-24 object-cover rounded border" />
                        ) : (
                          <video src={media.url} controls preload="metadata" className="w-full h-24 object-cover rounded border" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
