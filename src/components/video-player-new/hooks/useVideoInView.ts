import { useEffect, useRef, useState, useCallback } from 'react';
import { useVideoContext } from '@/contexts/VideoContext';

export const useVideoInView = (
  videoRef: React.RefObject<HTMLVideoElement>,
  threshold = 0.6,
  videoId: string
) => {
  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const wasPlayingRef = useRef(false);
  const { activeVideoId, setActiveVideoId } = useVideoContext();

  const handleVisibilityChange = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (document.hidden) {
      wasPlayingRef.current = !video.paused;
      video.pause();
    } else if (wasPlayingRef.current && isInView && activeVideoId === videoId) {
      video.play().catch(() => {});
    }
  }, [isInView, videoRef, activeVideoId, videoId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const visible = entry.isIntersecting && entry.intersectionRatio >= threshold;
        setIsInView(visible);

        if (visible) {
          // This video is now in view - make it the active video
          setActiveVideoId(videoId);
        }
      },
      {
        threshold: [0, threshold, 1],
        rootMargin: '0px',
      }
    );

    observerRef.current.observe(video);

    // Handle tab visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observerRef.current?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [videoRef, threshold, videoId, setActiveVideoId, handleVisibilityChange]);

  // Control play/pause based on active video state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInView) return;

    if (activeVideoId === videoId) {
      // This is the active video - play it
      if (video.paused && !document.hidden) {
        video.play().catch(() => {});
      }
    } else {
      // Another video is active - pause this one
      if (!video.paused) {
        video.pause();
      }
    }
  }, [activeVideoId, videoId, isInView, videoRef]);

  return { isInView };
};
