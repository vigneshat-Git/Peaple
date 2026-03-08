import { apiClient } from "./client";
import type { Comment, CreateCommentRequest } from "./types";

export const commentService = {
  create(data: CreateCommentRequest) {
    return apiClient.post<Comment>("/comments", data);
  },

  getByPost(postId: string) {
    return apiClient.get<Comment[]>(`/posts/${postId}/comments`);
  },

  delete(commentId: string) {
    return apiClient.delete<void>(`/comments/${commentId}`);
  },
};
