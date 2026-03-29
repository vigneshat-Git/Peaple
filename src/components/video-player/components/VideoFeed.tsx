import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { VideoPlayer } from './VideoPlayer';
import { VideoData } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

interface VideoFeedProps {
  videos: VideoData[];
  startIndex?: number;
  className?: string;
}

export const VideoFeed = ({ videos, startIndex = 0, className = '' }: VideoFeedProps) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set([startIndex]));
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isMobile = useIsMobile();

  // Intersection Observer for lazy loading and autoplay
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.6, // Video must be 60% visible to play
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = Number(entry.target.getAttribute('data-index'));
        
        if (entry.isIntersecting) {
          // Load nearby videos
          setLoadedVideos((prev) => {
            const newSet = new Set(prev);
            newSet.add(index);
            // Preload next and previous
            if (index > 0) newSet.add(index - 1);
            if (index < videos.length - 1) newSet.add(index + 1);
            return newSet;
          });
          
          setCurrentIndex(index);
        }
      });
    }, observerOptions);

    videoRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [videos.length]);

  const handleNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      videoRefs.current[nextIndex]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [currentIndex, videos.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      videoRefs.current[prevIndex]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious]);

  return (
    <div 
      ref={containerRef}
      className={`relative h-screen overflow-hidden bg-black ${className}`}
    >
      <div className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            ref={(el) => { videoRefs.current[index] = el; }}
            data-index={index}
            className="h-screen w-full snap-start snap-always flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: loadedVideos.has(index) ? 1 : 0,
              scale: index === currentIndex ? 1 : 0.95
            }}
            transition={{ duration: 0.3 }}
          >
            {loadedVideos.has(index) ? (
              <div className={`relative ${isMobile ? 'w-full h-full' : 'w-full max-w-4xl aspect-video'}`}>
                <VideoPlayer
                  video={video}
                  isActive={index === currentIndex}
                  isMobile={isMobile}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onSwipeUp={() => {}}
                  onSwipeDown={() => {}}
                  className="w-full h-full rounded-lg"
                />
              </div>
            ) : (
              // Loading placeholder
              <div className="w-full max-w-4xl aspect-video bg-muted animate-pulse rounded-lg" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Navigation Indicators (Desktop) */}
      {!isMobile && videos.length > 1 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                videoRefs.current[index]?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center' 
                });
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-primary w-2 h-6' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="text-white/70 text-sm font-medium">
          {currentIndex + 1} / {videos.length}
        </span>
      </div>
    </div>
  );
};
