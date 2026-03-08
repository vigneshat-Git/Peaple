// ── Shared Types ──

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  reputation: number;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  banner_url?: string;
  created_by: string;
  member_count: number;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: Pick<User, "id" | "username" | "avatar_url">;
  community: Pick<Community, "id" | "name">;
  media_url?: string;
  score: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  user_vote?: "up" | "down" | null;
  tags: string[];
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author: Pick<User, "id" | "username" | "avatar_url">;
  parent_comment_id: string | null;
  content: string;
  score: number;
  user_vote?: "up" | "down" | null;
  replies?: Comment[];
  created_at: string;
}

export type VoteType = "up" | "down";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ── Auth ──

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

// ── Posts ──

export interface CreatePostRequest {
  title: string;
  content: string;
  community_id: string;
  media_url?: string;
  tags?: string[];
}

// ── Comments ──

export interface CreateCommentRequest {
  post_id: string;
  content: string;
  parent_comment_id?: string;
}

// ── Feed ──

export type FeedSort = "hot" | "new" | "top";
