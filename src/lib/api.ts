const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://peaple-production.up.railway.app/api";

class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("token");
    
    // Debug logging for authentication
    //console.log(`[API Debug] Request to: ${endpoint}`);
    //console.log(`[API Debug] Token exists: ${!!token}`);
    //console.log(`[API Debug] Token value: ${token?.substring(0, 20)}...`);
    //console.log(`[API Debug] Token is "undefined": ${token === "undefined"}`);
    
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && token !== "undefined"
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...options.headers
      }
    };

    const headers = config.headers as Record<string, string>;
    //console.log(`[API Debug] Authorization header:`, headers.Authorization);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          console.error('[API Error] 401 Unauthorized - clearing invalid token');
          localStorage.removeItem("token");
          localStorage.removeItem("peaple_user");
          
          // Trigger a page reload to redirect to login
          window.location.href = '/login';
        }
        
        throw new ApiError(
          errorData.message || errorData.error || 'Request failed',
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error occurred', 0);
    }
  }

  // Communities
  async getCommunities(page = 1, limit = 20) {
    return this.request(`/communities?page=${page}&limit=${limit}`);
  }

  async getCommunity(id: string) {
    return this.request(`/communities/${id}`);
  }

  async createCommunity(data: {
    name: string;
    description: string;
    icon_url?: string;
    banner_url?: string;
  }) {
    return this.request('/communities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCommunity(id: string) {
    return this.request(`/communities/${id}`, {
      method: 'DELETE',
    });
  }

  async joinCommunity(communityId: string) {
    return this.request('/communities/join', {
      method: 'POST',
      body: JSON.stringify({ community_id: communityId }),
    });
  }

  async leaveCommunity(communityId: string) {
    return this.request('/communities/leave', {
      method: 'POST',
      body: JSON.stringify({ community_id: communityId }),
    });
  }

  async getCommunityMembers(communityId: string, page = 1, limit = 20) {
    return this.request(`/communities/${communityId}/members?page=${page}&limit=${limit}`);
  }

  // Posts
  async getPosts(page = 1, limit = 20, sort = 'new') {
    return this.request(`/posts?page=${page}&limit=${limit}&sort=${sort}`);
  }

  async getPost(id: string) {
    return this.request(`/posts/${id}`);
  }

  async getCommunityPosts(communityId: string, page = 1, limit = 20, sort = 'new') {
    return this.request(`/posts/community/${communityId}?page=${page}&limit=${limit}&sort=${sort}`);
  }

  async createPost(data: {
    title: string;
    content: string;
    community_id: string;
    media?: Array<{ url: string; type: string; fileName?: string }>;
  }) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateUploadUrl(data: { fileType: string; fileName?: string }): Promise<{ uploadUrl: string; fileUrl: string; key: string; maxSize?: number }> {
    const response = await this.request('/posts/upload-url', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Handle both wrapped (success/data) and unwrapped responses
    const resultData = response.data || response;
    
    console.log('Upload URL API response:', response);
    console.log('Extracted data:', resultData);
    
    // Validate uploadUrl exists
    if (!resultData || !resultData.uploadUrl) {
      console.error('Upload URL is missing in response:', resultData);
      throw new ApiError('Upload URL is missing from server response', 500);
    }
    
    // Return with both publicUrl (for frontend compatibility) and fileUrl
    return {
      uploadUrl: resultData.uploadUrl,
      fileUrl: resultData.fileUrl || resultData.publicUrl,
      key: resultData.key,
      maxSize: resultData.maxSize,
    };
  }

  async deletePost(id: string) {
    return this.request(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async updatePost(id: string, data: Partial<{
    title: string;
    content: string;
    media_url?: string;
  }>) {
    return this.request(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Votes
  async voteOnPost(postId: string, voteType: 'upvote' | 'downvote') {
    return this.request(`/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    });
  }

  async voteOnComment(commentId: string, voteType: 'upvote' | 'downvote') {
    return this.request(`/comments/${commentId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    });
  }

  async getUserVoteOnPost(postId: string) {
    return this.request(`/votes/post/${postId}/user`);
  }

  async getUserVoteOnComment(commentId: string) {
    return this.request(`/votes/comment/${commentId}/user`);
  }

  // Comments
  async getPostComments(postId: string, page = 1, limit = 20) {
    return this.request(`/posts/${postId}/comments?page=${page}&limit=${limit}`);
  }

  async createComment(data: {
    postId: string;
    content: string;
    parentCommentId?: string;
  }) {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify({
        postId: data.postId,
        content: data.content,
        parentId: data.parentCommentId, // Backend expects parentId
      }),
    });
  }

  async deleteComment(id: string) {
    return this.request(`/comments/${id}`, {
      method: 'DELETE',
    });
  }

  async updateComment(id: string, data: { content: string }) {
    return this.request(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Feed
  async getFeed(page = 1, limit = 20, sort = 'hot') {
    return this.request(`/posts?page=${page}&limit=${limit}&sort=${sort}`);
  }

  async getTrendingPosts(page = 1, limit = 20) {
    return this.request(`/posts/trending?page=${page}&limit=${limit}`);
  }

  // Generic POST method for voting and other requests
  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Users
  async getUserById(id: string) {
    return this.request(`/auth/${id}`);
  }

  async getUserCommunities(page = 1, limit = 20) {
    return this.request(`/user/communities?page=${page}&limit=${limit}`);
  }

  // Search
  async searchPosts(keyword: string, page = 1, limit = 20) {
    return this.request(`/posts/search/keyword/${encodeURIComponent(keyword)}?page=${page}&limit=${limit}`);
  }

  async searchCommunities(keyword: string, page = 1, limit = 20) {
    return this.request(`/communities/search/${encodeURIComponent(keyword)}?page=${page}&limit=${limit}`);
  }
}

export const apiService = new ApiService();
export { ApiError };
