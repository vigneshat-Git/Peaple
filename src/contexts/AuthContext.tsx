import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  reputation?: number;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://peaple-production.up.railway.app";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("peaple_user");
    
    // Only restore if token is valid and not "undefined"
    if (storedToken && storedToken !== "undefined" && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("peaple_user");
      }
    } else {
      // Clear invalid token if it exists
      if (storedToken === "undefined") {
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    
    console.log("Login backend response:", data);
    
    const newToken =
      data?.data?.token ||
      data?.token ||
      data?.accessToken ||
      null;
    
    const newUser =
      data?.data?.user ||
      data?.user ||
      null;

    console.log("Stored token:", newToken);

    if (!newToken || newToken === "undefined") {
      throw new Error("No valid token received from server");
    }

    localStorage.setItem("token", newToken);
    localStorage.setItem("peaple_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Registration failed");
    }

    const data = await response.json();
    
    console.log("Register backend response:", data);
    
    const newToken =
      data?.data?.token ||
      data?.token ||
      data?.accessToken ||
      null;
    
    const newUser =
      data?.data?.user ||
      data?.user ||
      null;

    console.log("Stored token:", newToken);

    if (!newToken || newToken === "undefined") {
      throw new Error("No valid token received from server");
    }

    localStorage.setItem("token", newToken);
    localStorage.setItem("peaple_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("peaple_user");
      setToken(null);
      setUser(null);
    }
  };

  const loginWithGoogle = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        loginWithGoogle,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
