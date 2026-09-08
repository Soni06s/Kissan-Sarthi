import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(true);

  // Initialize session on load
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getProfile();
          if (res.data?.data?.user) {
            setUser(res.data.data.user);
            setIsAuthenticated(true);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          // 401 interceptor in api.js should handle refresh, if that fails it will throw
          handleLogout();
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    setIsAuthenticated(true);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      if (token) await authAPI.logout();
      if (auth.currentUser) await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.getProfile();
      if (res.data?.data?.user) {
        updateUser(res.data.data.user);
      }
    } catch (error) {
      console.error("Failed to refresh user profile", error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || 'farmer',
      token,
      isAuthenticated,
      isLoading: loading,
      loading,
      login,
      logout: handleLogout,
      updateUser,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
