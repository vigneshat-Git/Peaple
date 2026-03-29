import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Volume2, VolumeX, X, MoreVertical, Share2, Bookmark, Flag, Ban, EyeOff, UserPlus,
  MessageCircle, Heart, Play, Pause, ChevronUp, ChevronDown, ArrowBigUp, ArrowBigDown
} from 'lucide-react';
import { VideoData, VideoPlayerState, CommentData } from '../types';
import { CommentsPanel } from './CommentsPanel';

interface DesktopFullscreenViewProps {
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

export const DesktopFullscreenView = ({
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
}: DesktopFullscreenViewProps) => {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTapIndicator, setShowTapIndicator] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const y = useMotionValue(0);
  const x = useMotionValue(0);
  const opacity = useTransform(y, [-200, 0, 200], [0.7, 1, 0.7]);

  // Hide swipe hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-play when entering fullscreen
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Ensure video is playing when entering fullscreen
    if (video.paused) {
      video.play().catch(() => {});
    }
  }, [videoRef]);

  // Show controls temporarily
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (state.isPlaying) setShowControls(false);
    }, 3000);
  }, [state.isPlaying]);

  // Handle tap on video
  const handleVideoTap = useCallback(() => {
    showControlsTemporarily();
    togglePlay();
    setShowTapIndicator(true);
    setTimeout(() => setShowTapIndicator(false), 500);
  }, [showControlsTemporarily, togglePlay]);

  // Handle swipe gestures
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const threshold = 100;
    const velThreshold = 500;

    // Vertical - comments (swipe up to open)
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
  }, [currentIndex, videos.length, onNavigate]);

  const progressPct = state.duration ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex"
      style={{ opacity }}
    >
      {/* Main Video Area with Gestures */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className="relative flex-1 h-full"
      >
        {/* Horizontal swipe areas */}
        <div className="absolute inset-0 flex">
          <motion.div 
            className="w-1/6 h-full z-10 cursor-w-resize flex items-center justify-start pl-4"
            onClick={(e) => {
              e.stopPropagation();
              if (currentIndex > 0) onNavigate(currentIndex - 1);
            }}
          >
            {currentIndex > 0 && (
              <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                <ChevronUp className="w-6 h-6 -rotate-90" />
              </div>
            )}
          </motion.div>
          
          <div 
            className="flex-1 h-full z-10"
            onClick={handleVideoTap}
          />
          
          <motion.div 
            className="w-1/6 h-full z-10 cursor-e-resize flex items-center justify-end pr-4"
            onClick={(e) => {
              e.stopPropagation();
              if (currentIndex < videos.length - 1) onNavigate(currentIndex + 1);
            }}
          >
            {currentIndex < videos.length - 1 && (
              <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                <ChevronUp className="w-6 h-6 rotate-90" />
              </div>
            )}
          </motion.div>
        </div>

        <video
          ref={videoRef}
          src={video.src}
          poster={video.poster}
          className="w-full h-full object-contain"
          playsInline
          loop
          muted={state.isMuted}
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
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <span className="text-white font-semibold text-lg">
                c/{video.community.name}
              </span>

              {/* 3-dot Menu */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
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

        {/* Swipe Hints */}
        {showSwipeHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-black/60 rounded-xl px-6 py-4 text-center">
              <p className="text-white text-sm mb-2">Swipe up for comments</p>
              <p className="text-white/70 text-xs">Swipe left/right to navigate</p>
              <ChevronUp className="w-6 h-6 text-white mx-auto mt-2 animate-bounce" />
            </div>
          </motion.div>
        )}

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
              <button 
                onClick={(e) => { e.stopPropagation(); onLike(); }} 
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-primary' : 'bg-black/50 hover:bg-black/70'}`}>
                  <ArrowBigUp className={`w-8 h-8 ${isLiked ? 'fill-white text-white' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-medium">
                  {video.likes > 1000 ? `${(video.likes / 1000).toFixed(1)}K` : video.likes}
                </span>
              </button>

              {/* Downvote */}
              <button 
                onClick={(e) => { e.stopPropagation(); onDislike(); }} 
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDisliked ? 'bg-destructive' : 'bg-black/50 hover:bg-black/70'}`}>
                  <ArrowBigDown className={`w-8 h-8 ${isDisliked ? 'fill-white text-white' : 'text-white'}`} />
                </div>
              </button>

              {/* Comment */}
              <button 
                onClick={(e) => { e.stopPropagation(); setShowComments(true); }} 
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">
                  {video.comments.length > 1000 ? `${(video.comments.length / 1000).toFixed(1)}K` : video.comments.length}
                </span>
              </button>

              {/* Save */}
              <button 
                onClick={(e) => { e.stopPropagation(); onSave(); }} 
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSaved ? 'bg-primary' : 'bg-black/50 hover:bg-black/70'}`}>
                  <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-white text-white' : 'text-white'}`} />
                </div>
              </button>

              {/* Share */}
              <button 
                onClick={(e) => { e.stopPropagation(); onShare(); }} 
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
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
                className="flex items-center gap-3 mb-3 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center overflow-hidden">
                  {video.author.avatar ? (
                    <img src={video.author.avatar} alt={video.author.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-white text-lg">{video.author.username[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-lg">@{video.author.username}</p>
                  <p className="text-white/80 text-sm line-clamp-1 group-hover:text-white transition-colors">{video.title}</p>
                </div>
                <ChevronUp className="w-6 h-6 text-white/50" />
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={state.duration || 100}
                  value={state.currentTime}
                  onChange={(e) => {
                    e.stopPropagation();
                    seek(parseFloat(e.target.value));
                  }}
                  className="flex-1 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-transform"
                />
                <span className="text-white text-sm font-medium tabular-nums w-20 text-right">
                  {formatTime(state.currentTime)} / {formatTime(state.duration)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
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
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
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
