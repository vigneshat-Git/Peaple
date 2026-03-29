import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { VideoPlayerNew } from './VideoPlayer';
import { VideoData } from '../types';

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

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          if (entry.isIntersecting) {
            setLoadedVideos((prev) => {
              const newSet = new Set(prev);
              newSet.add(index);
              if (index > 0) newSet.add(index - 1);
              if (index < videos.length - 1) newSet.add(index + 1);
              return newSet;
            });
            setCurrentIndex(index);
          }
        });
      },
      { threshold: 0.6 }
    );

    videoRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, [videos.length]);

  const handleNavigate = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < videos.length) {
      setCurrentIndex(newIndex);
      videoRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [videos.length]);

  return (
    <div ref={containerRef} className={`h-screen w-full bg-black overflow-hidden ${className}`}>
      <div className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            ref={(el) => { videoRefs.current[index] = el; }}
            data-index={index}
            className="h-screen w-full snap-start snap-always flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: loadedVideos.has(index) ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {loadedVideos.has(index) ? (
              <VideoPlayerNew
                video={video}
                videos={videos}
                currentIndex={index}
                isActive={index === currentIndex}
                isMobile={true}
                onNavigate={handleNavigate}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-muted animate-pulse" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
