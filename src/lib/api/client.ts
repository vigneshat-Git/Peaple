const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem("access_token");
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options;
    const token = this.getToken();

    const config: RequestInit = {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (response.status === 401) {
      // Attempt token refresh
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const retryConfig: RequestInit = {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${this.getToken()}`,
          },
        };
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, retryConfig);
        if (!retryResponse.ok) throw new ApiError(retryResponse.status, await retryResponse.text());
        return retryResponse.json();
      }
      // Refresh failed — clear tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.dispatchEvent(new Event("auth:logout"));
      throw new ApiError(401, "Session expired");
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ApiError(response.status, errorBody);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "POST", body });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "PUT", body });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
