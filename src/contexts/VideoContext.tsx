import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface VideoContextType {
  // Global mute state - shared across all videos
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  toggleMute: () => void;
  
  // Active video tracking - only one video can be active at a time
  activeVideoId: string | null;
  setActiveVideoId: (id: string | null) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider = ({ children }: { children: ReactNode }) => {
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return (
    <VideoContext.Provider
      value={{
        isMuted,
        setIsMuted,
        toggleMute,
        activeVideoId,
        setActiveVideoId,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideoContext must be used within VideoProvider');
  }
  return context;
};
