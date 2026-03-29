import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { DesktopControls } from './DesktopControls';
import { MobileReelsControls } from './MobileReelsControls';
import { CommentsBottomSheet } from './CommentsBottomSheet';
import { VideoData, VideoQuality } from '../types';

interface VideoPlayerProps {
  video: VideoData;
  isActive?: boolean;
  isMobile?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
}

const DEFAULT_QUALITIES: VideoQuality[] = [
  { label: '144p', value: '144' },
  { label: '240p', value: '240' },
  { label: '360p', value: '360' },
  { label: '480p', value: '480' },
  { label: '720p', value: '720' },
  { label: '1080p', value: '1080' },
];

export const VideoPlayer = ({
  video,
  isActive = true,
  isMobile = false,
  onNext,
  onPrevious,
  onSwipeUp,
  onSwipeDown,
  className = '',
}: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const {
    videoRef,
    state,
    togglePlay,
    toggleMute,
    setVolume,
    seek,
    setQuality,
    toggleFullscreen,
    toggleSubtitles,
    showControlsTemporarily,
    formatTime,
  } = useVideoPlayer({
    src: video.src,
    hlsSrc: video.hlsSrc,
    autoPlay: isActive,
    loop: true,
    qualities: video.qualities || DEFAULT_QUALITIES,
  });

  // Handle visibility change (pause when tab hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        videoRef.current?.pause();
      } else if (isActive) {
        videoRef.current?.play();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, videoRef]);

  // Handle active state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {
        // Autoplay blocked
      });
    } else {
      video.pause();
    }
  }, [isActive, videoRef]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Gesture handling for mobile
  const y = useMotionValue(0);
  const x = useMotionValue(0);
  const opacity = useTransform(y, [-200, 0, 200], [0.5, 1, 0.5]);
  const scale = useTransform(y, [-200, 0, 200], [0.9, 1, 0.9]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    // Vertical swipe (comments)
    if (Math.abs(offset.y) > Math.abs(offset.x)) {
      if (offset.y < -swipeThreshold || velocity.y < -velocityThreshold) {
        onSwipeUp?.();
        setShowComments(true);
      } else if (offset.y > swipeThreshold || velocity.y > velocityThreshold) {
        onSwipeDown?.();
        if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    } else {
      // Horizontal swipe (next/prev video)
      if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
        onPrevious?.();
      } else if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
        onNext?.();
      }
    }
  }, [onNext, onPrevious, onSwipeUp, onSwipeDown, isFullscreen]);

  const handleToggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const handleClose = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const handleCommentSubmit = useCallback((content: string) => {
    console.log('New comment:', content);
    // TODO: Integrate with your API
  }, []);

  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  }, [isLiked, isDisliked]);

  const handleDislike = useCallback(() => {
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  }, [isDisliked, isLiked]);

  const handleSave = useCallback(() => {
    setIsSaved(!isSaved);
  }, [isSaved]);

  const handleFollow = useCallback(() => {
    setIsFollowing(!isFollowing);
  }, [isFollowing]);

  return (
    <motion.div
      ref={containerRef}
      className={`relative bg-black overflow-hidden ${className}`}
      style={{ opacity, scale }}
      drag={isMobile ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={video.poster}
        playsInline
        muted={state.isMuted}
        loop
        onClick={() => {
          if (!isMobile) {
            togglePlay();
            showControlsTemporarily();
          }
        }}
        onMouseMove={() => {
          if (!isMobile) {
            showControlsTemporarily();
          }
        }}
      >
        {/* Subtitles */}
        {video.subtitles?.map((sub) => (
          <track
            key={sub.srclang}
            kind="subtitles"
            src={sub.src}
            srcLang={sub.srclang}
            label={sub.label}
            default={state.showSubtitles && sub.srclang === 'en'}
          />
        ))}
      </video>

      {/* Controls Overlay */}
      {isMobile ? (
        <MobileReelsControls
          state={state}
          video={video}
          isFullscreen={isFullscreen}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onToggleFullscreen={handleToggleFullscreen}
          onSeek={seek}
          onToggleSubtitles={toggleSubtitles}
          onClose={handleClose}
          onShare={() => console.log('Share')}
          onSave={handleSave}
          onReport={() => console.log('Report')}
          onBlock={() => console.log('Block')}
          onHide={() => console.log('Hide')}
          onFollow={handleFollow}
          onLike={handleLike}
          onDislike={handleDislike}
          onComment={() => setShowComments(true)}
          formatTime={formatTime}
          isLiked={isLiked}
          isDisliked={isDisliked}
          isSaved={isSaved}
          isFollowing={isFollowing}
        />
      ) : (
        <DesktopControls
          state={state}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onVolumeChange={setVolume}
          onSeek={seek}
          onToggleFullscreen={toggleFullscreen}
          onQualityChange={setQuality}
          onToggleSubtitles={toggleSubtitles}
          onShowControls={showControlsTemporarily}
          formatTime={formatTime}
          qualities={video.qualities || DEFAULT_QUALITIES}
        />
      )}

      {/* Comments Bottom Sheet */}
      <AnimatePresence>
        {showComments && (
          <CommentsBottomSheet
            video={video}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
            onCommentSubmit={handleCommentSubmit}
          />
        )}
      </AnimatePresence>

      {/* Gesture Hint (Mobile Only) */}
      {isMobile && isFullscreen && (
        <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none opacity-30">
          <motion.div
            animate={{ x: [0, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white text-xs"
          >
            ← Swipe
          </motion.div>
        </div>
      )}
      {isMobile && isFullscreen && (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none opacity-30">
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white text-xs"
          >
            Swipe →
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
