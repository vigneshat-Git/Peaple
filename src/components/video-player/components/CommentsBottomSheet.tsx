import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, animate } from 'framer-motion';
import { X, MessageCircle, Heart, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommentData, VideoData } from '../types';

interface CommentsBottomSheetProps {
  video: VideoData;
  isOpen: boolean;
  onClose: () => void;
  onCommentSubmit: (content: string) => void;
}

const CommentItem = ({ comment, depth = 0 }: { comment: CommentData; depth?: number }) => {
  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''} py-3`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.author.avatar ? (
            <img 
              src={comment.author.avatar} 
              alt={comment.author.username}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              {comment.author.username[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-foreground">
              {comment.author.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-sm text-foreground leading-relaxed">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Heart className="h-3.5 w-3.5" />
              <span>{comment.likes}</span>
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentsBottomSheet = ({
  video,
  isOpen,
  onClose,
  onCommentSubmit,
}: CommentsBottomSheetProps) => {
  const [commentText, setCommentText] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);
  const scale = useTransform(y, [0, 300], [1, 0.95]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    } else {
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  const handleSubmit = () => {
    if (commentText.trim()) {
      onCommentSubmit(commentText.trim());
      setCommentText('');
    }
  };

  useEffect(() => {
    if (isOpen) {
      y.set(0);
    }
  }, [isOpen, y]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        ref={sheetRef}
        style={{ y, opacity, scale }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[85vh] flex flex-col"
      >
        {/* Drag Handle */}
        <div className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-muted rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg">
              {video.comments.length} {video.comments.length === 1 ? 'Comment' : 'Comments'}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Video Info Section */}
        <div className="px-4 py-4 border-b bg-muted/30">
          <h4 className="font-semibold text-base mb-1 line-clamp-1">{video.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>c/{video.community.name}</span>
            <span>·</span>
            <span>@{video.author.username}</span>
          </div>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1 px-4">
          <div className="py-2">
            {video.comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No comments yet</p>
                <p className="text-sm text-muted-foreground mt-1">Be the first to comment!</p>
              </div>
            ) : (
              video.comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Comment Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2.5 rounded-full bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              size="icon"
              className="rounded-full h-10 w-10 shrink-0"
              disabled={!commentText.trim()}
              onClick={handleSubmit}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
