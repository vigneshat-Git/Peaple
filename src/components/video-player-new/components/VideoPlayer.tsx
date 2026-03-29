import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useIsMobile } from '../hooks/useIsMobile';
import { DesktopPlayer } from './DesktopPlayer';
import { MobileInlinePlayer } from './MobileInlinePlayer';
import { MobileFullscreenView } from './MobileFullscreenView';
import { VideoData } from '../types';

interface VideoPlayerProps {
  video: VideoData;
  videos?: VideoData[]; // For navigation
  currentIndex?: number;
  isActive?: boolean;
  forceMobile?: boolean;
  onNavigate?: (index: number) => void;
  className?: string;
}

export const VideoPlayerNew = ({
  video,
  videos = [],
  currentIndex = 0,
  isActive = true,
  forceMobile,
  onNavigate,
  className = '',
}: VideoPlayerProps) => {
  const detectedMobile = useIsMobile();
  const isMobile = forceMobile !== undefined ? forceMobile : detectedMobile;
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    toggleSubtitles,
    formatTime,
  } = useVideoPlayer({
    src: video.src,
    autoPlay: isActive,
    loop: true,
  });

  const handleLike = useCallback(() => {
    setIsLiked(prev => !prev);
    if (isDisliked) setIsDisliked(false);
  }, [isDisliked]);

  const handleDislike = useCallback(() => {
    setIsDisliked(prev => !prev);
    if (isLiked) setIsLiked(false);
  }, [isLiked]);

  const handleSave = useCallback(() => setIsSaved(prev => !prev), []);
  const handleFollow = useCallback(() => setIsFollowing(prev => !prev), []);

  // Desktop Player
  if (!isMobile) {
    return (
      <DesktopPlayer
        video={video}
        videoRef={videoRef}
        state={state}
        togglePlay={togglePlay}
        toggleMute={toggleMute}
        setVolume={setVolume}
        seek={seek}
        setQuality={setQuality}
        toggleSubtitles={toggleSubtitles}
        formatTime={formatTime}
        className={className}
      />
    );
  }

  // Mobile - Inline View
  if (!isFullscreen) {
    return (
      <MobileInlinePlayer
        video={video}
        videoRef={videoRef}
        state={state}
        toggleMute={toggleMute}
        onEnterFullscreen={() => setIsFullscreen(true)}
        className={className}
      />
    );
  }

  // Mobile - Fullscreen View
  return (
    <AnimatePresence>
      {isFullscreen && (
        <MobileFullscreenView
          video={video}
          videos={videos}
          currentIndex={currentIndex}
          videoRef={videoRef}
          state={state}
          togglePlay={togglePlay}
          toggleMute={toggleMute}
          seek={seek}
          toggleSubtitles={toggleSubtitles}
          onClose={() => setIsFullscreen(false)}
          onNavigate={(idx) => {
            onNavigate?.(idx);
          }}
          formatTime={formatTime}
          isLiked={isLiked}
          isDisliked={isDisliked}
          isSaved={isSaved}
          isFollowing={isFollowing}
          onLike={handleLike}
          onDislike={handleDislike}
          onSave={handleSave}
          onShare={() => console.log('Share')}
          onReport={() => console.log('Report')}
          onBlock={() => console.log('Block')}
          onHide={() => console.log('Hide')}
          onFollow={handleFollow}
        />
      )}
    </AnimatePresence>
  );
};
