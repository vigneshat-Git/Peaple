import { apiClient } from "./client";
import type { VoteType } from "./types";

export const voteService = {
  vote(postId: string, type: VoteType) {
    return apiClient.post<{ score: number }>(`/votes`, { post_id: postId, vote_type: type });
  },

  removeVote(postId: string) {
    return apiClient.delete<{ score: number }>(`/votes/${postId}`);
  },
};
