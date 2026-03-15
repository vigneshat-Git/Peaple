import { MessageSquare, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import VoteButtons from "./VoteButtons";
import UserAvatar from "./UserAvatar";
import { Badge } from "@/components/ui/badge";

export interface PostData {
  id: string;
  title: string;
  content: string;
  author: string;
  community: string;
  votes: number;
  comments: number;
  tags?: string[];
  timeAgo: string;
}

const PostCard = ({ post }: { post: PostData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg border p-4 card-hover"
    >
      <div className="flex gap-3">
        <VoteButtons initialVotes={post.votes} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to={`/c/${post.community}`} className="font-semibold text-foreground hover:text-primary transition-colors">
              c/{post.community}
            </Link>
            <span>•</span>
            <span>Posted by {post.author}</span>
            <span>•</span>
            <span>{post.timeAgo}</span>
          </div>
          <Link to={`/post/${post.id}`}>
            <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors mb-1.5 leading-snug">
              {post.title}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {post.content}
          </p>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {post.tags?.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal bg-primary-light text-primary-dark border-0">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link to={`/post/${post.id}`} className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
              <MessageSquare className="h-4 w-4" />
              {post.comments} Comments
            </Link>
            <button className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
              <Bookmark className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;
