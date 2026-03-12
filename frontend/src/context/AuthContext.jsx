import { createContext, useCallback, useEffect, useState } from "react";
import * as authService from "../services/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) return;

      const response = await authService.getMe();
      if (!response.ok)
        throw new Error(response.error || "Failed to fetch user");

      setUser(response.user);
      localStorage.setItem("user", JSON.stringify(response.user));
    } catch (err) {
      console.error("refreshUser error:", err.message);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken) {
          setToken(storedToken);
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        if (storedToken) {
          await refreshUser();
        }
      } catch (err) {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshUser, clearAuth]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      if (!response.ok) throw new Error(response.error || "Login failed");

      const { token, user } = response;
      setToken(token);
      setUser(user);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      return { success: true, user };
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Login failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      if (!response.ok) {
        throw new Error(response.error || "Registration failed");
      }

      const { token, user } = response;
      setToken(token);
      setUser(user);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      return { success: true, user };
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Registration failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const updateUserProfile = useCallback(async (userData) => {
    setError(null);
    try {
      const response = await authService.updateProfile(userData);
      if (!response.ok) throw new Error(response.error || "Update failed");

      const updatedUser = response.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return { success: true, user: updatedUser };
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Update failed";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        logout,
        updateUserProfile,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
