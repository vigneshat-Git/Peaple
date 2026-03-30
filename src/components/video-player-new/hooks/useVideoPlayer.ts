import { useState, useRef, useCallback, useEffect } from 'react';
import Hls from 'hls.js';
import { useVideoContext } from '@/contexts/VideoContext';
import { VideoPlayerState, VideoQuality } from '../types';

interface UseVideoPlayerProps {
  src: string;
  hlsSrc?: string;
  autoPlay?: boolean;
  loop?: boolean;
  qualities?: VideoQuality[];
}

export const useVideoPlayer = ({
  src,
  hlsSrc: externalHlsSrc,
  autoPlay = false,
  loop = true,
  qualities,
  videoId,
}: UseVideoPlayerProps & { videoId: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const hlsSrc = externalHlsSrc && externalHlsSrc.endsWith('.m3u8') ? externalHlsSrc : null;
  
  // Use global mute state
  const { isMuted: globalIsMuted, toggleMute: globalToggleMute, activeVideoId, setActiveVideoId } = useVideoContext();

  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    isMuted: globalIsMuted, // Use global mute state
    volume: 1,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    quality: 'auto',
    showSubtitles: false,
    isLoading: true,
    isBuffering: false,
    error: null,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track video element changes
  useEffect(() => {
    setVideoElement(videoRef.current);
  }, [videoRef.current]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    
    
    const onError = (e: Event) => {
      console.error('[VideoPlayer] Video error:', e, video.error);
      const errorMsg = video.error?.message || 'Failed to load video';
      setState(prev => ({ ...prev, isLoading: false, isBuffering: false, error: errorMsg }));
    };

    const onLoadStart = () => console.log('');
    const onLoadedData = () => console.log('');

    video.addEventListener('error', onError);
    video.addEventListener('loadstart', onLoadStart);
    video.addEventListener('loadeddata', onLoadedData);

    if (hlsSrc && Hls.isSupported()) {
      console.log('[VideoPlayer] Using HLS:', hlsSrc);
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(hlsSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setState(prev => ({ ...prev, isLoading: false }));
        if (autoPlay) video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('[VideoPlayer] HLS error:', event, data);
      });
      hlsRef.current = hls;
    } else {
      
      video.src = hlsSrc || src;
    }

    return () => {
      hlsRef.current?.destroy();
      video.removeEventListener('error', onError);
      video.removeEventListener('loadstart', onLoadStart);
      video.removeEventListener('loadeddata', onLoadedData);
    };
  }, [hlsSrc, src, autoPlay, videoElement]);

  // Smooth timeline using requestAnimationFrame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;
    
    const updateTime = () => {
      setState(prev => ({
        ...prev,
        currentTime: video.currentTime,
        buffered: video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0,
      }));
      rafId = requestAnimationFrame(updateTime);
    };

    // Start RAF when playing
    const onPlay = () => {
      rafId = requestAnimationFrame(updateTime);
    };

    // Stop RAF when paused
    const onPause = () => {
      cancelAnimationFrame(rafId);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    
    // Start if already playing
    if (!video.paused) {
      rafId = requestAnimationFrame(updateTime);
    }

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [videoElement]);

  // Video events (metadata, buffering, etc.)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: video.duration, isLoading: false }));
    };

    const onWaiting = () => setState(prev => ({ ...prev, isBuffering: true }));
    const onCanPlay = () => setState(prev => ({ ...prev, isBuffering: false }));
    const onPlay = () => setState(prev => ({ ...prev, isPlaying: true }));
    const onPause = () => setState(prev => ({ ...prev, isPlaying: false }));

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    const onError = (e: Event) => {
      console.error('[VideoPlayer] Event error:', e);
    };
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onError);
    };
  }, [videoElement]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Ignore AbortError - this happens when play() is interrupted
          if (err.name !== 'AbortError') {
            console.error('[VideoPlayer] Play error:', err);
          }
        });
      }
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    // Use global toggle - affects all videos
    globalToggleMute();
  }, [globalToggleMute]);

  // Sync video muted state with global mute state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = globalIsMuted;
    setState(prev => ({ ...prev, isMuted: globalIsMuted }));
  }, [globalIsMuted]);

  const setVolume = useCallback((vol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = vol;
    setState(prev => ({ ...prev, volume: vol, isMuted: vol === 0 }));
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  const setQuality = useCallback((quality: string) => {
    if (!hlsRef.current || quality === 'auto') {
      setState(prev => ({ ...prev, quality }));
      return;
    }
    const levels = hlsRef.current.levels;
    const idx = levels.findIndex(l => l.height === parseInt(quality));
    if (idx !== -1) {
      hlsRef.current.currentLevel = idx;
      setState(prev => ({ ...prev, quality }));
    }
  }, []);

  const toggleSubtitles = useCallback(() => {
    setState(prev => ({ ...prev, showSubtitles: !prev.showSubtitles }));
  }, []);

  // Handle back button when in fullscreen
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (document.fullscreenElement && e.state?.fullscreen) {
        e.preventDefault();
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
        history.pushState(null, '', location.href);
      }
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen && history.state?.fullscreen) {
        history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await video.requestFullscreen();
        setIsFullscreen(true);
        // Push state to handle back button
        history.pushState({ fullscreen: true, videoId }, '');
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('[VideoPlayer] Fullscreen error:', err);
    }
  }, [videoId]);

  const formatTime = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  return {
    videoRef,
    state,
    isFullscreen,
    togglePlay,
    toggleMute,
    toggleFullscreen,
    setVolume,
    seek,
    setQuality,
    toggleSubtitles,
    formatTime,
  };
};
