import { useEffect, useState } from "react";
import {
  forgotPassword as forgotPasswordRequest,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  resendVerification as resendVerificationRequest,
  resetPassword as resetPasswordRequest,
  setAuthToken,
  verifyEmail as verifyEmailRequest,
  whoAmI
} from "../lib/api";

const TOKEN_STORAGE_KEY = "energy-ai-auth-token";

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function useAuth() {
  const [token, setToken] = useState(readStoredToken);
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      if (!token) {
        setUser(null);
        setIsBootstrapping(false);
        return;
      }

      setIsBootstrapping(true);

      try {
        const result = await whoAmI();
        if (!ignore) {
          setUser(result.user);
        }
      } catch {
        if (!ignore) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setAuthToken("");
          setToken("");
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      ignore = true;
    };
  }, [token]);

  function persistSession(nextToken, nextUser) {
    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser || null);
  }

  async function register(payload) {
    const result = await registerRequest(payload);
    persistSession(result.token, result.user);
    return result;
  }

  async function login(payload) {
    const result = await loginRequest(payload);
    persistSession(result.token, result.user);
    return result;
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // Clear local auth state even if the backend session already expired.
    } finally {
      persistSession("", null);
    }
  }

  async function refreshUser() {
    if (!token) {
      setUser(null);
      return null;
    }

    const result = await whoAmI();
    setUser(result.user);
    return result.user;
  }

  async function verifyEmail(tokenValue) {
    const result = await verifyEmailRequest({ token: tokenValue });

    if (user && result.user?.id === user.id) {
      setUser(result.user);
    }

    return result;
  }

  return {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    isBootstrapping,
    register,
    login,
    logout,
    refreshUser,
    verifyEmail,
    resendVerification: resendVerificationRequest,
    forgotPassword: forgotPasswordRequest,
    resetPassword: resetPasswordRequest
  };
}
