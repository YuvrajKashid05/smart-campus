import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setAuthToken } from "../services/api";
import authService from "../services/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const persistAuth = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    setAuthToken(nextToken);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      clearAuth();
      setLoading(false);
      return;
    }

    try {
      setAuthToken(storedToken);
      const response = await authService.me();

      if (!response?.ok || !response?.user) {
        throw new Error(response?.error || "Unable to fetch user");
      }

      setToken(storedToken);
      setUser(response.user);
      localStorage.setItem("user", JSON.stringify(response.user));
      setError("");
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await refreshUser();
      if (!mounted) return;
    };

    init();

    return () => {
      mounted = false;
    };
  }, [clearAuth, refreshUser]);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError("");

      try {
        const response = await authService.login(email, password);

        if (!response?.ok || !response?.token || !response?.user) {
          throw new Error(response?.error || "Login failed");
        }

        persistAuth(response.token, response.user);

        return {
          success: true,
          user: response.user,
        };
      } catch (err) {
        const rawError = err.response?.data?.error;

        let message = "Login failed";

        if (typeof rawError === "string") {
          message = rawError;
        } else if (err.message) {
          message = err.message;
        }

        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [persistAuth],
  );

  const register = useCallback(
    async (payload) => {
      setLoading(true);
      setError("");

      try {
        const response = await authService.register(payload);

        if (!response?.ok) {
          throw new Error(response?.error || "Registration failed");
        }

        if (response.token && response.user) {
          persistAuth(response.token, response.user);
        }

        return {
          success: true,
          user: response.user,
          token: response.token,
        };
      } catch (err) {
        const rawError = err.response?.data?.error;

        let message = "Registration failed";

        if (typeof rawError === "string") {
          message = rawError;
        } else if (rawError?.properties?.errors?.length) {
          message = rawError.properties.errors.join(", ");
        } else if (err.message) {
          message = err.message;
        }

        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [persistAuth],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore server logout failure
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const updateUserProfile = useCallback(async (updates) => {
    try {
      const response = await authService.updateProfile(updates);

      if (!response?.ok || !response?.user) {
        throw new Error(response?.error || "Profile update failed");
      }

      setUser(response.user);
      localStorage.setItem("user", JSON.stringify(response.user));

      return {
        success: true,
        user: response.user,
      };
    } catch (err) {
      const rawError = err.response?.data?.error;

      let message = "Profile update failed";

      if (typeof rawError === "string") {
        message = rawError;
      } else if (err.message) {
        message = err.message;
      }

      setError(message);

      return {
        success: false,
        error: message,
      };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      refreshUser,
      updateUserProfile,
      clearAuth,
    }),
    [
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser,
      updateUserProfile,
      clearAuth,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
