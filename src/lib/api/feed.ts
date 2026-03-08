import { apiClient } from "./client";
import type { FeedSort, PaginatedResponse, Post } from "./types";

export const feedService = {
  getFeed(sort: FeedSort = "hot", page = 1) {
    return apiClient.get<PaginatedResponse<Post>>(`/feed?sort=${sort}&page=${page}`);
  },

  getTrending() {
    return apiClient.get<Post[]>("/feed/trending");
  },
};
