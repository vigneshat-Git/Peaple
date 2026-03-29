import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { VideoData, VideoPlayerState } from '../types';

interface MobileInlinePlayerProps {
  video: VideoData;
  videoRef: React.RefObject<HTMLVideoElement>;
  state: VideoPlayerState;
  toggleMute: () => void;
  onEnterFullscreen: () => void;
  className?: string;
}

export const MobileInlinePlayer = ({
  video,
  videoRef,
  state,
  toggleMute,
  onEnterFullscreen,
  className = '',
}: MobileInlinePlayerProps) => {
  return (
    <div 
      className={`relative bg-black overflow-hidden ${className}`}
      onClick={onEnterFullscreen}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={video.poster}
        playsInline
        loop
        muted={state.isMuted}
      />

      {/* Loading */}
      {(state.isLoading || state.isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Bottom Right Mute Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white"
      >
        {state.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
};
