import { apiClient } from "./client";
import type { CreatePostRequest, FeedSort, PaginatedResponse, Post } from "./types";

export const postService = {
  create(data: CreatePostRequest) {
    return apiClient.post<Post>("/posts", data);
  },

  getById(id: string) {
    return apiClient.get<Post>(`/posts/${id}`);
  },

  delete(id: string) {
    return apiClient.delete<void>(`/posts/${id}`);
  },

  getByCommunity(communityName: string, sort: FeedSort = "hot", page = 1) {
    return apiClient.get<PaginatedResponse<Post>>(
      `/communities/${communityName}/posts?sort=${sort}&page=${page}`
    );
  },
};
