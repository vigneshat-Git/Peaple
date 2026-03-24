//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://peaple-production.up.railway.app";

const getToken = () => localStorage.getItem("peaple_token");

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data ?? data;
};

// ----------- Community Service -----------
export const communityService = {
  createCommunity: (body: { name: string; description: string; rules?: string }) =>
    request("/communities", { method: "POST", body: JSON.stringify(body) }),

  getCommunity: (name: string) => request(`/communities/${name}`),

  listCommunities: () => request("/communities"),

  joinCommunity: (name: string) =>
    request(`/communities/${name}/join`, { method: "POST" }),

  leaveCommunity: (name: string) =>
    request(`/communities/${name}/leave`, { method: "POST" }),
};

// ----------- Post Service -----------
export const postService = {
  createPost: (body: {
    title: string;
    content: string;
    community_name: string;
    media_url?: string;
    tags?: string[];
  }) => request("/posts", { method: "POST", body: JSON.stringify(body) }),

  getPosts: (params?: { community?: string; sort?: string; page?: number }) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request(`/posts${qs}`);
  },

  getPost: (id: string) => request(`/posts/${id}`),

  deletePost: (id: string) => request(`/posts/${id}`, { method: "DELETE" }),
};

// ----------- Vote Service -----------
export const voteService = {
  vote: (postId: string, type: "upvote" | "downvote") =>
    request(`/votes`, { method: "POST", body: JSON.stringify({ post_id: postId, vote_type: type }) }),

  removeVote: (postId: string) =>
    request(`/votes/${postId}`, { method: "DELETE" }),
};

// ----------- Comment Service -----------
export const commentService = {
  getComments: (postId: string) => request(`/comments?post_id=${postId}`),

  createComment: (body: { post_id: string; content: string; parent_comment_id?: string }) =>
    request("/comments", { method: "POST", body: JSON.stringify(body) }),

  deleteComment: (id: string) => request(`/comments/${id}`, { method: "DELETE" }),
};

// ----------- Feed Service -----------
export const feedService = {
  getFeed: (type: "home" | "popular" | "new" = "home") =>
    request(`/feed?type=${type}`),

  getTrending: () => request("/feed/trending"),
};

// ----------- Auth Service -----------
export const authService = {
  getCurrentUser: () => request("/auth/me"),
  updateProfile: (body: { bio?: string; avatar?: string }) =>
    request("/auth/profile", { method: "PATCH", body: JSON.stringify(body) }),
};
