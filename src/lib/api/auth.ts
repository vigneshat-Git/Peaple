import { apiClient } from "./client";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "./types";

export const authService = {
  login(data: LoginRequest) {
    return apiClient.post<AuthResponse>("/auth/login", data);
  },

  register(data: RegisterRequest) {
    return apiClient.post<AuthResponse>("/auth/register", data);
  },

  getMe() {
    return apiClient.get<User>("/auth/me");
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};
