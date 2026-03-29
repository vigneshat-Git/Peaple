import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VideoPlayerState, VideoQuality } from '../types';

interface DesktopControlsProps {
  state: VideoPlayerState;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onToggleFullscreen: () => void;
  onQualityChange: (quality: string) => void;
  onToggleSubtitles: () => void;
  onShowControls: () => void;
  formatTime: (seconds: number) => string;
  qualities?: VideoQuality[];
}

export const DesktopControls = ({
  state,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onSeek,
  onToggleFullscreen,
  onQualityChange,
  onToggleSubtitles,
  onShowControls,
  formatTime,
  qualities,
}: DesktopControlsProps) => {
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    onSeek(pos * state.duration);
  };

  const progressPercent = state.duration > 0 
    ? (state.currentTime / state.duration) * 100 
    : 0;

  const bufferedPercent = state.duration > 0 
    ? (state.buffered / state.duration) * 100 
    : 0;

  return (
    <AnimatePresence>
      {(state.showControls || !state.isPlaying) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-auto"
          onMouseMove={onShowControls}
          onClick={(e) => {
            // Prevent click from bubbling to video if clicking controls
            e.stopPropagation();
          }}
        >
          {/* Top Bar - Title & Subtitles */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onToggleSubtitles}
              >
                <Subtitles className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Center - Play/Pause Button (Large) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              {!state.isPlaying && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-auto"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlay();
                    }}
                  >
                    <Play className="h-10 w-10 ml-1" fill="white" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Controls */}
          <div className="p-4 space-y-3">
            {/* Loading/Buffering Indicator */}
            {(state.isLoading || state.isBuffering) && (
              <div className="flex items-center justify-center py-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                />
              </div>
            )}

            {/* Progress Bar */}
            <div
              ref={progressRef}
              className="group relative h-1.5 bg-white/30 rounded-full cursor-pointer hover:h-2.5 transition-all"
              onClick={handleProgressClick}
            >
              {/* Buffered Progress */}
              <div
                className="absolute h-full bg-white/50 rounded-full"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Current Progress */}
              <div
                className="absolute h-full bg-primary rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Seek Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPercent}% - 8px)` }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-9 w-9"
                  onClick={onTogglePlay}
                >
                  {state.isPlaying ? (
                    <Pause className="h-5 w-5" fill="white" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" fill="white" />
                  )}
                </Button>

                {/* Skip Back/Forward */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={() => onSeek(Math.max(0, state.currentTime - 10))}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={() => onSeek(Math.min(state.duration, state.currentTime + 10))}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                {/* Volume Control */}
                <div
                  className="flex items-center gap-2 group"
                  onMouseEnter={() => setIsVolumeHovered(true)}
                  onMouseLeave={() => setIsVolumeHovered(false)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-9 w-9"
                    onClick={onToggleMute}
                  >
                    {state.isMuted || state.volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  <AnimatePresence>
                    {isVolumeHovered && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 80, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <Slider
                          value={[state.isMuted ? 0 : state.volume * 100]}
                          max={100}
                          step={1}
                          onValueChange={([value]) => onVolumeChange(value / 100)}
                          className="w-20 [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_.bg-primary]:bg-white"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Time Display */}
                <span className="text-sm text-white font-medium tabular-nums">
                  {formatTime(state.currentTime)} / {formatTime(state.duration)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Settings */}
                <DropdownMenu open={showSettings} onOpenChange={setShowSettings}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-9 w-9"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-black/90 border-white/20">
                    <div className="px-2 py-1.5 text-xs text-white/70 font-medium">
                      Quality
                    </div>
                    {qualities?.map((quality) => (
                      <DropdownMenuItem
                        key={quality.value}
                        onClick={() => onQualityChange(quality.value)}
                        className={`text-white hover:bg-white/20 cursor-pointer ${
                          state.quality === quality.value ? 'bg-white/20' : ''
                        }`}
                      >
                        {quality.label}
                        {state.quality === quality.value && (
                          <span className="ml-auto text-primary">✓</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      onClick={() => onQualityChange('auto')}
                      className={`text-white hover:bg-white/20 cursor-pointer ${
                        state.quality === 'auto' ? 'bg-white/20' : ''
                      }`}
                    >
                      Auto
                      {state.quality === 'auto' && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-9 w-9"
                  onClick={onToggleFullscreen}
                >
                  {state.isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
