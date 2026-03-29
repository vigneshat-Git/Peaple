import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Subtitles } from 'lucide-react';
import { VideoData, VideoPlayerState, VideoQuality } from '../types';

interface DesktopPlayerProps {
  video: VideoData;
  videoRef: React.RefObject<HTMLVideoElement>;
  state: VideoPlayerState;
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (vol: number) => void;
  seek: (time: number) => void;
  setQuality: (q: string) => void;
  toggleSubtitles: () => void;
  formatTime: (secs: number) => string;
  qualities?: VideoQuality[];
  className?: string;
}

export const DesktopPlayer = ({
  video,
  videoRef,
  state,
  togglePlay,
  toggleMute,
  setVolume,
  seek,
  setQuality,
  toggleSubtitles,
  formatTime,
  qualities,
  className = '',
}: DesktopPlayerProps) => {
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hoverVolume, setHoverVolume] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const DEFAULT_QUALITIES: VideoQuality[] = [
    { label: 'Auto', value: 'auto' },
    { label: '144p', value: '144' },
    { label: '240p', value: '240' },
    { label: '360p', value: '360' },
    { label: '480p', value: '480' },
    { label: '720p', value: '720' },
    { label: '1080p', value: '1080' },
  ];

  const qualityOptions = qualities?.length ? qualities : DEFAULT_QUALITIES;

  // Auto-hide controls
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (state.isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !state.duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seek(pct * state.duration);
  };

  const progressPct = state.duration ? (state.currentTime / state.duration) * 100 : 0;
  const bufferedPct = state.duration ? (state.buffered / state.duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black overflow-hidden group ${className}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => state.isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        poster={video.poster}
        playsInline
        loop
        muted={state.isMuted}
        onClick={togglePlay}
      />

      {/* Error Display */}
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center p-4">
            <p className="text-red-400 font-medium mb-2">Failed to load video</p>
            <p className="text-white/70 text-sm">{state.error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/80"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {(state.isLoading || state.isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Center Play/Pause Indicator */}
      <AnimatePresence>
        {!state.isPlaying && !state.isLoading && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between p-3 pointer-events-auto">
              <button
                onClick={toggleSubtitles}
                className={`p-2 rounded-full transition-colors ${state.showSubtitles ? 'bg-primary text-white' : 'text-white hover:bg-white/20'}`}
              >
                <Subtitles className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="p-3 space-y-2 pointer-events-auto">
              {/* Progress Bar */}
              <div
                ref={progressRef}
                className="relative h-1.5 bg-white/30 rounded-full cursor-pointer hover:h-2 transition-all"
                onClick={handleProgressClick}
              >
                <div
                  className="absolute h-full bg-white/50 rounded-full"
                  style={{ width: `${bufferedPct}%` }}
                />
                <div
                  className="absolute h-full bg-primary rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progressPct}% - 6px)` }}
                />
              </div>

              {/* Buttons Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                  >
                    {state.isPlaying ? (
                      <Pause className="w-5 h-5" fill="white" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" fill="white" />
                    )}
                  </button>

                  {/* Volume */}
                  <div
                    className="flex items-center gap-1"
                    onMouseEnter={() => setHoverVolume(true)}
                    onMouseLeave={() => setHoverVolume(false)}
                  >
                    <button
                      onClick={toggleMute}
                      className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                      {state.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    {hoverVolume && (
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={state.isMuted ? 0 : state.volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Time */}
                  <span className="text-white text-sm font-medium tabular-nums">
                    {formatTime(state.currentTime)} / {formatTime(state.duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Settings */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                    {showSettings && (
                      <div className="absolute bottom-full right-0 mb-2 w-32 bg-black/90 rounded-lg overflow-hidden border border-white/20">
                        <div className="px-3 py-2 text-xs text-white/70 border-b border-white/20">Quality</div>
                        {qualityOptions.map((q) => (
                          <button
                            key={q.value}
                            onClick={() => { setQuality(q.value); setShowSettings(false); }}
                            className={`w-full px-3 py-2 text-sm text-left text-white hover:bg-white/20 transition-colors flex items-center justify-between ${state.quality === q.value ? 'bg-white/20' : ''}`}
                          >
                            {q.label}
                            {state.quality === q.value && <span className="text-primary">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={handleToggleFullscreen}
                    className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
