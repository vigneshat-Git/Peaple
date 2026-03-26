import { MessageSquare, Bookmark, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import VoteButtons from "./VoteButtons";
import PostCardMenu from "./PostCardMenu";

export interface PostData {
  id: string;
  title: string;
  content: string;
  author: string | { id: string; username: string };
  community: string | { id: string; name: string };
  votes?: number;
  upvotes?: number;
  score?: string;
  comments: number;
  tags?: string[];
  timeAgo: string;
  media?: Array<{ id: string; url: string; type: string; file_name?: string }>;
}

const PostCard = ({ post, onVoteChange }: { 
  post: PostData; 
  onVoteChange?: (newVotes: number, userVote: "up" | "down" | null) => void;
}) => {
  const communityName = typeof post.community === 'string' 
    ? post.community 
    : post.community?.name || 'unknown';
    
  const authorName = typeof post.author === 'string' 
    ? post.author 
    : post.author?.username || 'unknown';

  const voteCount = post.upvotes ?? post.votes ?? 0;

  return (
    <div className="bg-card rounded-md border hover:border-muted-foreground/30 transition-colors duration-150">
      <div className="flex">
        <div className="flex-shrink-0 w-10 bg-secondary/50 rounded-l-md flex items-start justify-center pt-4">
          <VoteButtons 
            initialVotes={voteCount} 
            postId={post.id}
            onVoteChange={(newVotes, userVote) => onVoteChange?.(newVotes, userVote)}
          />
        </div>
        <div className="flex-1 min-w-0 p-4 pl-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <Link to={`/c/${communityName}`} className="font-semibold text-foreground hover:underline shrink-0">
                c/{communityName}
              </Link>
              <span>·</span>
              <span className="truncate">Posted by u/{authorName}</span>
              <span>·</span>
              <span className="shrink-0">{post.timeAgo}</span>
            </div>
            <PostCardMenu postId={post.id} authorUsername={authorName} />
          </div>
          <Link to={`/post/${post.id}`}>
            <h3 className="text-base font-semibold text-foreground hover:underline leading-snug mb-1">
              {post.title}
            </h3>
          </Link>
<<<<<<< HEAD
          {post.media && post.media.length > 0 && (
            <div className="mb-2">
              {post.media[0].type === 'image' ? (
                <img src={post.media[0].url} alt="Media" className="w-16 h-16 object-cover rounded border float-left mr-3" />
              ) : (
                <video src={post.media[0].url} className="w-16 h-16 object-cover rounded border float-left mr-3" preload="metadata" />
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
=======
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
>>>>>>> 4b39facdcc12e53e5679ec2ef30412238f3117f8
            {post.content}
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Link to={`/post/${post.id}`} className="flex items-center gap-1.5 text-xs font-medium hover:bg-secondary px-2 py-1 rounded-sm transition-colors duration-150">
              <MessageSquare className="h-4 w-4" />
              {post.comments} Comments
            </Link>
            <button className="flex items-center gap-1.5 text-xs font-medium hover:bg-secondary px-2 py-1 rounded-sm transition-colors duration-150">
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button className="flex items-center gap-1.5 text-xs font-medium hover:bg-secondary px-2 py-1 rounded-sm transition-colors duration-150">
              <Bookmark className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
