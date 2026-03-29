import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  MoreVertical,
  Share2,
  Bookmark,
  Flag,
  Ban,
  EyeOff,
  UserPlus,
  Subtitles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { VideoPlayerState, VideoData } from '../types';

interface MobileReelsControlsProps {
  state: VideoPlayerState;
  video: VideoData;
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onSeek: (time: number) => void;
  onToggleSubtitles: () => void;
  onClose: () => void;
  onShare: () => void;
  onSave: () => void;
  onReport: () => void;
  onBlock: () => void;
  onHide: () => void;
  onFollow: () => void;
  onLike: () => void;
  onDislike: () => void;
  onComment: () => void;
  formatTime: (seconds: number) => string;
  isLiked?: boolean;
  isDisliked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
}

export const MobileReelsControls = ({
  state,
  video,
  isFullscreen,
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  onSeek,
  onToggleSubtitles,
  onClose,
  onShare,
  onSave,
  onReport,
  onBlock,
  onHide,
  onFollow,
  onLike,
  onDislike,
  onComment,
  formatTime,
  isLiked = false,
  isDisliked = false,
  isSaved = false,
  isFollowing = false,
}: MobileReelsControlsProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showTapIndicator, setShowTapIndicator] = useState(false);

  const handleVideoTap = () => {
    if (!isFullscreen) {
      onToggleFullscreen();
    } else {
      onTogglePlay();
      // Show play/pause indicator
      setShowTapIndicator(true);
      setTimeout(() => setShowTapIndicator(false), 600);
    }
  };

  const progressPercent = state.duration > 0 
    ? (state.currentTime / state.duration) * 100 
    : 0;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Tap Area for Play/Pause */}
      <div 
        className="absolute inset-0 pointer-events-auto"
        onClick={handleVideoTap}
      />

      {/* Top Bar - Only in Fullscreen */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-auto z-20"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-10 w-10"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="flex-1 text-center">
              <span className="text-white font-medium text-sm">
                c/{video.community.name}
              </span>
            </div>

            <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-10 w-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-black/90 border-white/20">
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onShare(); }}
                  className="text-white hover:bg-white/20 cursor-pointer"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onSave(); }}
                  className="text-white hover:bg-white/20 cursor-pointer"
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-primary text-primary' : ''}`} />
                  {isSaved ? 'Unsave' : 'Save'}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onToggleSubtitles(); }}
                  className="text-white hover:bg-white/20 cursor-pointer"
                >
                  <Subtitles className="h-4 w-4 mr-2" />
                  {state.showSubtitles ? 'Turn off captions' : 'Turn on captions'}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onReport(); }}
                  className="text-white hover:bg-white/20 cursor-pointer"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onBlock(); }}
                  className="text-white hover:bg-white/20 cursor-pointer"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Block
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onHide(); }}
                  className="text-white hover:bg-white/20 cursor-pointer"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide content
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onFollow(); }}
                  className="text-white hover:bg-white/20 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause Indicator (Center Tap Animation) */}
      <AnimatePresence>
        {showTapIndicator && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
              {state.isPlaying ? (
                <Pause className="h-10 w-10 text-white" fill="white" />
              ) : (
                <Play className="h-10 w-10 text-white ml-1" fill="white" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Side Actions - Only in Fullscreen */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto z-20"
          >
            {/* Like */}
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isLiked ? 'bg-primary' : 'bg-black/50 hover:bg-black/70'
              }`}>
                <svg 
                  className={`w-6 h-6 ${isLiked ? 'text-white fill-white' : 'text-white'}`} 
                  viewBox="0 0 24 24" 
                  fill={isLiked ? 'currentColor' : 'none'}
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <span className="text-white text-xs font-medium">
                {video.likes > 1000 ? `${(video.likes / 1000).toFixed(1)}K` : video.likes}
              </span>
            </button>

            {/* Dislike */}
            <button
              onClick={(e) => { e.stopPropagation(); onDislike(); }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isDisliked ? 'bg-destructive' : 'bg-black/50 hover:bg-black/70'
              }`}>
                <svg 
                  className={`w-6 h-6 ${isDisliked ? 'text-white fill-white' : 'text-white'}`} 
                  viewBox="0 0 24 24" 
                  fill={isDisliked ? 'currentColor' : 'none'}
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M12 2.65l1.45 1.32C18.6 8.64 22 11.72 22 15.5 22 18.58 19.58 21 16.5 21c-1.74 0-3.41-.81-4.5-2.09C10.91 20.19 9.24 21 7.5 21 4.42 21 2 18.58 2 15.5c0-3.78 3.4-6.86 8.55-11.54L12 2.65z" transform="rotate(180 12 12)"/>
                </svg>
              </div>
              <span className="text-white text-xs font-medium">
                {video.dislikes > 1000 ? `${(video.dislikes / 1000).toFixed(1)}K` : video.dislikes}
              </span>
            </button>

            {/* Comment */}
            <button
              onClick={(e) => { e.stopPropagation(); onComment(); }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9H21v.1Z"/>
                </svg>
              </div>
              <span className="text-white text-xs font-medium">
                {video.comments.length > 1000 ? `${(video.comments.length / 1000).toFixed(1)}K` : video.comments.length}
              </span>
            </button>

            {/* Save */}
            <button
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isSaved ? 'bg-primary' : 'bg-black/50 hover:bg-black/70'
              }`}>
                <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-white text-white' : 'text-white'}`} />
              </div>
              <span className="text-white text-xs font-medium">
                {video.saves > 1000 ? `${(video.saves / 1000).toFixed(1)}K` : video.saves}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">
                {video.shares > 1000 ? `${(video.shares / 1000).toFixed(1)}K` : video.shares}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Section - Timeline & Mute */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-auto">
        {/* Mute Button - Bottom Right (when not in fullscreen) */}
        {!isFullscreen && (
          <div className="absolute bottom-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
            >
              {state.isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        )}

        {/* Timeline - Only in Fullscreen */}
        {isFullscreen && (
          <div className="p-4 pt-8">
            {/* Time Display */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium tabular-nums">
                {formatTime(state.currentTime)}
              </span>
              <span className="text-white text-sm font-medium tabular-nums">
                {formatTime(state.duration)}
              </span>
            </div>

            {/* Progress Bar */}
            <Slider
              value={[progressPercent]}
              max={100}
              step={0.1}
              onValueChange={([value]) => {
                onSeek((value / 100) * state.duration);
              }}
              className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_.bg-primary]:bg-white [&_[data-orientation=horizontal]]:h-1"
            />
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {(state.isLoading || state.isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full"
          />
        </div>
      )}
    </div>
  );
};
