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
  hlsSrc,
  autoPlay = false,
  loop = true,
  qualities,
}: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

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
  });

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsSrc && Hls.isSupported()) {
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
      hlsRef.current = hls;
    } else {
      video.src = hlsSrc || src;
    }

    return () => {
      hlsRef.current?.destroy();
    };
  }, [hlsSrc, src, autoPlay]);

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

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
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
