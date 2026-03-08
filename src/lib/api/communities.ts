import { apiClient } from "./client";
import type { Community } from "./types";

export const communityService = {
  getAll() {
    return apiClient.get<Community[]>("/communities");
  },

  getByName(name: string) {
    return apiClient.get<Community>(`/communities/${name}`);
  },

  create(data: { name: string; description: string }) {
    return apiClient.post<Community>("/communities", data);
  },

  join(communityId: string) {
    return apiClient.post<void>(`/communities/${communityId}/join`);
  },

  leave(communityId: string) {
    return apiClient.delete<void>(`/communities/${communityId}/join`);
  },
};
