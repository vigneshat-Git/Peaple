export interface VideoQuality {
  label: string;
  value: string;
  src?: string;
}

export interface VideoAuthor {
  id: string;
  username: string;
  avatar?: string;
}

export interface VideoCommunity {
  id: string;
  name: string;
}

export interface CommentData {
  id: string;
  content: string;
  author: VideoAuthor;
  createdAt: string;
  likes: number;
  replies?: CommentData[];
}

export interface VideoData {
  id: string;
  src: string;
  poster?: string;
  title: string;
  description: string;
  author: VideoAuthor;
  community: VideoCommunity;
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

export interface VideoPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  buffered: number;
  quality: string;
  showSubtitles: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  error: string | null;
}
