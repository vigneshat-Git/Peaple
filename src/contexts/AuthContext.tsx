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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://peaple-production.up.railway.app/api";

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
      data?.data?.access_token ||
      data?.access_token ||
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
      data?.data?.access_token ||
      data?.access_token ||
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

  const loginWithGoogle = async () => {
    // Open backend Google OAuth in popup
    const authUrl = `${API_BASE_URL}/auth/google`;
    const popup = window.open(authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes');
    
    if (!popup) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }
    
    // Listen for messages from popup
    return new Promise<void>((resolve, reject) => {
      let checkClosed: ReturnType<typeof setInterval> | null = null;
      let messageReceived = false;
      
      console.log('[AuthContext] Starting OAuth flow, waiting for message...');
      
      const messageListener = (event: MessageEvent) => {
        console.log('[AuthContext] Received message:', event.data?.type, event.origin);
        
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
          console.log('[AuthContext] Success message received');
          messageReceived = true;
          if (checkClosed) clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          handleGoogleSignIn(event.data.token, event.data.user).then(resolve).catch(reject);
        } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
          console.log('[AuthContext] Error message received:', event.data.error);
          messageReceived = true;
          if (checkClosed) clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error || 'Google authentication failed'));
        }
      };
      
      window.addEventListener('message', messageListener);
      
      // Wait a bit before starting closed check (give time for redirects)
      setTimeout(() => {
        checkClosed = setInterval(() => {
          if (!messageReceived && popup.closed) {
            console.log('[AuthContext] Popup closed without message - cancelling');
            if (checkClosed) clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            reject(new Error('Authentication cancelled'));
          }
        }, 500);
      }, 3000);
    });
  };

  const handleGoogleSignIn = async (token: string, userData: User) => {
    if (!token || token === 'undefined') {
      throw new Error('No valid token received from server');
    }

    localStorage.setItem('token', token);
    localStorage.setItem('peaple_user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
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
