import { useState, useRef, useCallback, useEffect } from 'react';
import Hls from 'hls.js';
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
}: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  // Add cache-busting to prevent ERR_CACHE_OPERATION_NOT_SUPPORTED
  const videoSrcWithCache = src.includes('?') ? `${src}&_cb=${Date.now()}` : `${src}?_cb=${Date.now()}`;
  const hlsSrc = externalHlsSrc && externalHlsSrc.endsWith('.m3u8') ? externalHlsSrc : null;
  const hlsSrcWithCache = hlsSrc ? (hlsSrc.includes('?') ? `${hlsSrc}&_cb=${Date.now()}` : `${hlsSrc}?_cb=${Date.now()}`) : null;

  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    isMuted: true, // Start muted for autoplay
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

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('[VideoPlayer] Loading video:', src);
    
    const onError = (e: Event) => {
      console.error('[VideoPlayer] Video error:', e, video.error);
      const errorMsg = video.error?.message || 'Failed to load video';
      setState(prev => ({ ...prev, isLoading: false, isBuffering: false, error: errorMsg }));
    };

    const onLoadStart = () => console.log('[VideoPlayer] Load started');
    const onLoadedData = () => console.log('[VideoPlayer] Data loaded');

    video.addEventListener('error', onError);
    video.addEventListener('loadstart', onLoadStart);
    video.addEventListener('loadeddata', onLoadedData);

    if (hlsSrc && Hls.isSupported()) {
      console.log('[VideoPlayer] Using HLS:', hlsSrcWithCache);
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(hlsSrcWithCache || hlsSrc);
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
      console.log('[VideoPlayer] Using native video:', videoSrcWithCache);
      video.src = videoSrcWithCache;
    }

    return () => {
      hlsRef.current?.destroy();
      video.removeEventListener('error', onError);
      video.removeEventListener('loadstart', onLoadStart);
      video.removeEventListener('loadeddata', onLoadedData);
    };
  }, [hlsSrc, hlsSrcWithCache, videoSrcWithCache, src, autoPlay]);

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setState(prev => ({
        ...prev,
        currentTime: video.currentTime,
        buffered: video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0,
      }));
    };

    const onLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: video.duration, isLoading: false }));
    };

    const onWaiting = () => setState(prev => ({ ...prev, isBuffering: true }));
    const onCanPlay = () => setState(prev => ({ ...prev, isBuffering: false }));
    const onPlay = () => setState(prev => ({ ...prev, isPlaying: true }));
    const onPause = () => setState(prev => ({ ...prev, isPlaying: false }));

    video.addEventListener('timeupdate', onTimeUpdate);
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
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onError);
    };
  }, []);

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
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setState(prev => ({ ...prev, isMuted: video.muted }));
  }, []);

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

  const formatTime = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  return {
    videoRef,
    state,
    togglePlay,
    toggleMute,
    setVolume,
    seek,
    setQuality,
    toggleSubtitles,
    formatTime,
  };
};
