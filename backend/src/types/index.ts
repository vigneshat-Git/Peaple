/* ===========================
   CORE TYPE DEFINITIONS
   =========================== */

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  google_id?: string;
  profile_image?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  banner_url?: string;
  created_by: string;
  member_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  community_id: string;
  score: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: Date;
  updated_at: Date;
  // Nested objects for API responses
  author?: {
    id: string;
    username: string;
  };
  community?: {
    id: string;
    name: string;
  };
  media?: Array<{
    id: string;
    url: string;
    type: string;
    file_name?: string;
  }>;
}
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id?: string;
  content: string;
  score: number;
  created_at: Date;
  updated_at: Date;
}

export interface Vote {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  vote_type: 'upvote' | 'downvote';
  created_at: Date;
}

export interface CommunityMember {
  id: string;
  user_id: string;
  community_id: string;
  joined_at: Date;
}

/* ===========================
   REQUEST/RESPONSE TYPES
   =========================== */

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface FeedRequest {
  page?: number;
  limit?: number;
  sort?: 'trending' | 'new' | 'hot';
  community_id?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  community_id: string;
  media?: Array<{ url: string; type: string; fileName?: string }>;
}

export interface CreateCommentRequest {
  content: string;
  parent_comment_id?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
