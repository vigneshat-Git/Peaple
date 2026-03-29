import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, MoreVertical, Share2, Bookmark, Flag, Ban, EyeOff, UserPlus, MessageCircle, Heart, Send } from 'lucide-react';
import { VideoData, CommentData, VideoAuthor } from '../types';

interface CommentsPanelProps {
  video: VideoData;
  isOpen: boolean;
  onClose: () => void;
  onCommentSubmit: (content: string) => void;
}

const CommentItem = ({ comment, depth = 0 }: { comment: CommentData; depth?: number }) => (
  <div className={`${depth > 0 ? 'ml-4 border-l-2 border-border pl-3' : ''} py-2`}>
    <div className="flex gap-2">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
        {comment.author.username[0].toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm">{comment.author.username}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm mt-0.5">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <button className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {comment.likes}
          </button>
          <button>Reply</button>
        </div>
      </div>
    </div>
    {comment.replies?.map(reply => <CommentItem key={reply.id} comment={reply} depth={depth + 1} />)}
  </div>
);

export const CommentsPanel = ({ video, isOpen, onClose, onCommentSubmit }: CommentsPanelProps) => {
  const [commentText, setCommentText] = useState('');
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (commentText.trim()) {
      onCommentSubmit(commentText.trim());
      setCommentText('');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ y, opacity }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[70%] flex flex-col"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-muted rounded-full" />
        </div>

        {/* Video Info Header */}
        <div className="px-4 pb-3 border-b">
          <h3 className="font-bold text-base line-clamp-1">{video.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{video.description}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>c/{video.community.name}</span>
            <span>·</span>
            <span>@{video.author.username}</span>
          </div>
        </div>

        {/* Comments Count */}
        <div className="px-4 py-2 border-b flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{video.comments.length} Comments</span>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {video.comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            video.comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
          )}
        </div>

        {/* Comment Input */}
        <div className="p-3 border-t bg-background">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2.5 rounded-full bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={!commentText.trim()}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
