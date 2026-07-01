import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('peaple_user');

        if (storedToken && storedToken !== 'undefined' && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          if (storedToken === 'undefined') {
            await AsyncStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('peaple_user');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const data = response.data;

      const newToken = data?.data?.access_token || data?.access_token;
      const newUser = data?.data?.user || data?.user;

      if (!newToken || newToken === 'undefined') {
        throw new Error('No valid token received from server');
      }

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('peaple_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await apiClient.post('/auth/register', { username, email, password });
      const data = response.data;

      const newToken = data?.data?.access_token || data?.access_token;
      const newUser = data?.data?.user || data?.user;

      if (!newToken || newToken === 'undefined') {
        throw new Error('No valid token received from server');
      }

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('peaple_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('peaple_user');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};