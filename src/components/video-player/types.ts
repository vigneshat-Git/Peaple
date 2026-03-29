export interface VideoQuality {
  label: string;
  value: string;
  src?: string;
}

export interface VideoData {
  id: string;
  src: string;
  hlsSrc?: string;
  poster?: string;
  title: string;
  description: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  community: {
    id: string;
    name: string;
  };
  likes: number;
  dislikes: number;
  comments: CommentData[];
  saves: number;
  shares: number;
  createdAt: string;
  qualities?: VideoQuality[];
  subtitles?: {
    src: string;
    srclang: string;
    label: string;
  }[];
}

export interface CommentData {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  likes: number;
  replies?: CommentData[];
}

export interface VideoPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  buffered: number;
  playbackRate: number;
  quality: string;
  isFullscreen: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  showControls: boolean;
  showSubtitles: boolean;
}
