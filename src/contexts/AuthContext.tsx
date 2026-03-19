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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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

  const loginWithGoogle = async () => {
    try {
      // Use Google OAuth 2.0 popup flow
      const clientId = '814546020627-04jjtfg6kl5kcj7d7lkfr6h3nscqngmo.apps.googleusercontent.com';
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const scope = 'openid email profile';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=id_token&` +
        `scope=${encodeURIComponent(scope)}&` +
        `nonce=${Math.random().toString(36).substring(2, 15)}`;
      
      // Open popup
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes');
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
      
      // Listen for messages from popup
      return new Promise<void>((resolve, reject) => {
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            popup.close();
            window.removeEventListener('message', messageListener);
            handleGoogleSignIn(event.data.token).then(resolve).catch(reject);
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            popup.close();
            window.removeEventListener('message', messageListener);
            reject(new Error(event.data.error || 'Google authentication failed'));
          }
        };
        
        window.addEventListener('message', messageListener);
        
        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            reject(new Error('Authentication cancelled'));
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Google Sign-In initialization failed:', error);
      throw error;
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      // Send the Google ID token to your backend
      const backendResponse = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
      });

      if (!backendResponse.ok) {
        const error = await backendResponse.json().catch(() => ({}));
        throw new Error(error.message || 'Google authentication failed');
      }

      const data = await backendResponse.json();
      
      //console.log("Google backend response:", data);
      
      const newToken = data?.data?.access_token;
      const newUser = data?.data?.user;

      //console.log("Extracted token:", newToken);

      if (!newToken) {
        throw new Error("No valid token received from server");
      }

      localStorage.setItem('token', newToken);
      localStorage.setItem('peaple_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      
      //console.log("Google authentication successful, user logged in");
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
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
