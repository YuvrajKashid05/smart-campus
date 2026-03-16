import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authService from "../services/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return null;

    try {
      const payload = JSON.parse(atob(savedToken.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return null;
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }

    return savedToken;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const persistAuth = useCallback((authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(authUser));
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      clearAuth();
      return null;
    }

    try {
      const response = await authService.getMe();

      if (!response?.ok || !response?.user) {
        throw new Error(response?.error || "Failed to refresh user");
      }

      setUser(response.user);
      localStorage.setItem("user", JSON.stringify(response.user));
      return response.user;
    } catch (err) {
      clearAuth();
      throw err;
    }
  }, [clearAuth]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        if (localStorage.getItem("token")) {
          await refreshUser();
        }
      } catch (err) {
        if (mounted) {
          setError(
            typeof err?.response?.data?.error === "string"
              ? err.response.data.error
              : err.message || "Session expired",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

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
        const rawError = err?.response?.data?.error;

        const message =
          typeof rawError === "string"
            ? rawError
            : err.message || "Login failed";

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
        const rawError = err?.response?.data?.error;

        const message =
          typeof rawError === "string"
            ? rawError
            : err.message || "Registration failed";

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
      // ignore logout API failure
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
      const rawError = err?.response?.data?.error;

      const message =
        typeof rawError === "string"
          ? rawError
          : err.message || "Profile update failed";

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
