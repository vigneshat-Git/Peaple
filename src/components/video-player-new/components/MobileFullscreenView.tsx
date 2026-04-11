import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Volume2, VolumeX, X, MoreVertical, Share2, Bookmark, Flag, Ban, EyeOff, UserPlus,
  MessageCircle, ArrowBigUp, ArrowBigDown, Play, Pause
} from 'lucide-react';
import { VideoData, VideoPlayerState } from '../types';
import { CommentsPanel } from './CommentsPanel';

interface MobileFullscreenViewProps {
  video: VideoData;
  videos: VideoData[];
  currentIndex: number;
  videoRef: React.RefObject<HTMLVideoElement>;
  state: VideoPlayerState;
  togglePlay: () => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  toggleSubtitles: () => void;
  onClose: () => void;
  onNavigate: (index: number) => void;
  formatTime: (secs: number) => string;
  isLiked: boolean;
  isDisliked: boolean;
  isSaved: boolean;
  isFollowing: boolean;
  onLike: () => void;
  onDislike: () => void;
  onSave: () => void;
  onShare: () => void;
  onReport: () => void;
  onBlock: () => void;
  onHide: () => void;
  onFollow: () => void;
}

export const MobileFullscreenView = ({
  video,
  videos,
  currentIndex,
  videoRef,
  state,
  togglePlay,
  toggleMute,
  seek,
  toggleSubtitles,
  onClose,
  onNavigate,
  formatTime,
  isLiked,
  isDisliked,
  isSaved,
  isFollowing,
  onLike,
  onDislike,
  onSave,
  onShare,
  onReport,
  onBlock,
  onHide,
  onFollow,
}: MobileFullscreenViewProps) => {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTapIndicator, setShowTapIndicator] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const y = useMotionValue(0);
  const x = useMotionValue(0);
  const opacity = useTransform(y, [-200, 0, 200], [0.7, 1, 0.7]);

  // Show controls temporarily
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (state.isPlaying) setShowControls(false);
    }, 3000);
  };

  // Handle tap on video
  const handleVideoTap = () => {
    showControlsTemporarily();
    togglePlay();
    setShowTapIndicator(true);
    setTimeout(() => setShowTapIndicator(false), 500);
  };

  // Handle swipe gestures
  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const threshold = 100;
    const velThreshold = 500;

    // Vertical - comments
    if (Math.abs(offset.y) > Math.abs(offset.x)) {
      if (offset.y < -threshold || velocity.y < -velThreshold) {
        setShowComments(true);
      }
    } else {
      // Horizontal - navigate
      if (offset.x > threshold || velocity.x > velThreshold) {
        // Previous video (only if not first)
        if (currentIndex > 0) {
          onNavigate(currentIndex - 1);
        }
      } else if (offset.x < -threshold || velocity.x < -velThreshold) {
        // Next video (only if not last)
        if (currentIndex < videos.length - 1) {
          onNavigate(currentIndex + 1);
        }
      }
    }
  };

  const progressPct = state.duration ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      style={{ opacity }}
    >
      {/* Main Video Area with Gestures */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className="relative flex-1"
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          loop
          muted={state.isMuted}
        />

        {/* Tap Area */}
        <div 
          className="absolute inset-0 z-10"
          onClick={handleVideoTap}
        />

        {/* Top Bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent"
            >
              <button 
                onClick={onClose}
                className="p-2 text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <span className="text-white font-semibold">
                c/{video.community.name}
              </span>

              {/* 3-dot Menu */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-2 text-white"
                >
                  <MoreVertical className="w-6 h-6" />
                </button>
                
                {showMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-black/95 rounded-lg overflow-hidden border border-white/20 z-50">
                    <button onClick={() => { onShare(); setShowMenu(false); }} className="w-full px-4 py-3 text-white text-left hover:bg-white/10 flex items-center gap-2">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button onClick={() => { onSave(); setShowMenu(false); }} className="w-full px-4 py-3 text-white text-left hover:bg-white/10 flex items-center gap-2">
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-primary text-primary' : ''}`} /> {isSaved ? 'Unsave' : 'Save'}
                    </button>
                    <button onClick={() => { toggleSubtitles(); setShowMenu(false); }} className="w-full px-4 py-3 text-white text-left hover:bg-white/10 flex items-center gap-2">
                      <span className="text-xs border border-current px-1 rounded">CC</span> Captions
                    </button>
                    <div className="border-t border-white/20" />
                    <button onClick={() => { onReport(); setShowMenu(false); }} className="w-full px-4 py-3 text-white text-left hover:bg-white/10 flex items-center gap-2">
                      <Flag className="w-4 h-4" /> Report
                    </button>
                    <button onClick={() => { onBlock(); setShowMenu(false); }} className="w-full px-4 py-3 text-white text-left hover:bg-white/10 flex items-center gap-2">
                      <Ban className="w-4 h-4" /> Block
                    </button>
                    <button onClick={() => { onHide(); setShowMenu(false); }} className="w-full px-4 py-3 text-white text-left hover:bg-white/10 flex items-center gap-2">
                      <EyeOff className="w-4 h-4" /> Hide
                    </button>
                    <div className="border-t border-white/20" />
                    <button onClick={() => { onFollow(); setShowMenu(false); }} className="w-full px-4 py-3 text-white text-left hover:bg-white/10 flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/Pause Indicator */}
        <AnimatePresence>
          {showTapIndicator && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
                {state.isPlaying ? (
                  <Pause className="w-10 h-10 text-white" fill="white" />
                ) : (
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Side Actions */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30"
            >
              {/* Upvote */}
              <button onClick={(e) => { e.stopPropagation(); onLike(); }} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLiked ? 'bg-primary' : 'bg-black/50'}`}>
                  <ArrowBigUp className={`w-8 h-8 ${isLiked ? 'fill-white text-white' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-medium">
                  {video.likes > 1000 ? `${(video.likes / 1000).toFixed(1)}K` : video.likes}
                </span>
              </button>

              {/* Downvote */}
              <button onClick={(e) => { e.stopPropagation(); onDislike(); }} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDisliked ? 'bg-destructive' : 'bg-black/50'}`}>
                  <ArrowBigDown className={`w-8 h-8 ${isDisliked ? 'fill-white text-white' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-medium">
                  {video.dislikes > 1000 ? `${(video.dislikes / 1000).toFixed(1)}K` : video.dislikes}
                </span>
              </button>

              {/* Comment */}
              <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">
                  {video.comments.length > 1000 ? `${(video.comments.length / 1000).toFixed(1)}K` : video.comments.length}
                </span>
              </button>

              {/* Save */}
              <button onClick={(e) => { e.stopPropagation(); onSave(); }} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSaved ? 'bg-primary' : 'bg-black/50'}`}>
                  <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-white text-white' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-medium">
                  {video.saves > 1000 ? `${(video.saves / 1000).toFixed(1)}K` : video.saves}
                </span>
              </button>

              {/* Share */}
              <button onClick={(e) => { e.stopPropagation(); onShare(); }} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">
                  {video.shares > 1000 ? `${(video.shares / 1000).toFixed(1)}K` : video.shares}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Section - User Info + Timeline */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-30"
            >
              {/* User Info (Click to open comments) */}
              <div 
                onClick={() => setShowComments(true)}
                className="flex items-center gap-3 mb-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center">
                  {video.author.avatar ? (
                    <img src={video.author.avatar} alt={video.author.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="font-bold text-white">{video.author.username[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">@{video.author.username}</p>
                  <p className="text-white/80 text-sm line-clamp-1">{video.title}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={state.duration || 100}
                  value={state.currentTime}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
                <span className="text-white text-xs font-medium tabular-nums w-16 text-right">
                  {formatTime(state.currentTime)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="p-2 text-white"
                >
                  {state.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {(state.isLoading || state.isBuffering) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </motion.div>

      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && (
          <CommentsPanel
            video={video}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
            onCommentSubmit={(content) => console.log('Comment:', content)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
