import { useState, useRef, useCallback, useEffect, RefObject } from 'react';
import Hls from 'hls.js';
import { VideoPlayerState, VideoQuality } from '../types';

interface UseVideoPlayerProps {
  src: string;
  hlsSrc?: string;
  autoPlay?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  qualities?: VideoQuality[];
}

export const useVideoPlayer = ({
  src,
  hlsSrc,
  autoPlay = false,
  loop = false,
  onEnded,
  qualities,
}: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    isMuted: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    playbackRate: 1,
    quality: 'auto',
    isFullscreen: false,
    isLoading: true,
    isBuffering: false,
    showControls: true,
    showSubtitles: false,
  });

  // Initialize HLS if supported
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsSrc && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(hlsSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setState((prev) => ({ ...prev, isLoading: false }));
        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay blocked
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsSrc || src;
    } else {
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsSrc, src, autoPlay]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        currentTime: video.currentTime,
        buffered: video.buffered.length > 0 
          ? video.buffered.end(video.buffered.length - 1) 
          : 0,
      }));
    };

    const handleLoadedMetadata = () => {
      setState((prev) => ({
        ...prev,
        duration: video.duration,
        isLoading: false,
      }));
    };

    const handleWaiting = () => {
      setState((prev) => ({ ...prev, isBuffering: true }));
    };

    const handleCanPlay = () => {
      setState((prev) => ({ ...prev, isBuffering: false }));
    };

    const handleEnded = () => {
      if (loop) {
        video.currentTime = 0;
        video.play();
      } else {
        setState((prev) => ({ ...prev, isPlaying: false }));
        onEnded?.();
      }
    };

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [loop, onEnded]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (state.isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  }, [state.isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    setState((prev) => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setState((prev) => ({ ...prev, playbackRate: rate }));
  }, []);

  const setQuality = useCallback((quality: string) => {
    if (!hlsRef.current || quality === 'auto') {
      setState((prev) => ({ ...prev, quality }));
      return;
    }

    const hls = hlsRef.current;
    const levels = hls.levels;
    const levelIndex = levels.findIndex(
      (level) => level.height === parseInt(quality)
    );

    if (levelIndex !== -1) {
      hls.currentLevel = levelIndex;
      setState((prev) => ({ ...prev, quality }));
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (!state.isFullscreen) {
      try {
        if (video.requestFullscreen) {
          await video.requestFullscreen();
        } else if ((video as any).webkitRequestFullscreen) {
          await (video as any).webkitRequestFullscreen();
        }
        setState((prev) => ({ ...prev, isFullscreen: true }));
      } catch (error) {
        console.error('Fullscreen error:', error);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setState((prev) => ({ ...prev, isFullscreen: false }));
      } catch (error) {
        console.error('Exit fullscreen error:', error);
      }
    }
  }, [state.isFullscreen]);

  const toggleSubtitles = useCallback(() => {
    setState((prev) => ({ ...prev, showSubtitles: !prev.showSubtitles }));
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setState((prev) => ({ ...prev, showControls: true }));

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (state.isPlaying) {
        setState((prev) => ({ ...prev, showControls: false }));
      }
    }, 3000);
  }, [state.isPlaying]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    videoRef,
    state,
    togglePlay,
    toggleMute,
    setVolume,
    seek,
    setPlaybackRate,
    setQuality,
    toggleFullscreen,
    toggleSubtitles,
    showControlsTemporarily,
    formatTime,
    hls: hlsRef.current,
  };
};
