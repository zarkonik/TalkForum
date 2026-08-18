import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "../lib/apiClient";
import type { AuthResponse, LoginResponse, User } from "./types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: (idToken: string) => Promise<LoginResponse>;
  loginWithPassword: (email: string, password: string) => Promise<LoginResponse>;
  register: (email: string, password: string, displayName: string) => Promise<LoginResponse>;
  verifyTwoFactor: (challengeToken: string, code: string) => Promise<void>;
  verifyRecoveryCode: (challengeToken: string, recoveryCode: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "talkforum_token";
const USER_KEY = "talkforum_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      setUserState(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  function setUser(nextUser: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUserState(nextUser);
  }

  function applyAuthResponse(data: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  }

  async function handleLoginResponse(promise: Promise<{ data: LoginResponse }>) {
    const { data } = await promise;
    if (!data.requiresTwoFactor && data.token && data.user) {
      applyAuthResponse({ token: data.token, user: data.user });
    }
    return data;
  }

  function loginWithGoogle(idToken: string) {
    return handleLoginResponse(apiClient.post<LoginResponse>("/api/auth/google", { idToken }));
  }

  function loginWithPassword(email: string, password: string) {
    return handleLoginResponse(apiClient.post<LoginResponse>("/api/auth/login", { email, password }));
  }

  function register(email: string, password: string, displayName: string) {
    return handleLoginResponse(
      apiClient.post<LoginResponse>("/api/auth/register", { email, password, displayName })
    );
  }

  async function verifyTwoFactor(challengeToken: string, code: string) {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/2fa/verify", { challengeToken, code });
    applyAuthResponse(data);
  }

  async function verifyRecoveryCode(challengeToken: string, recoveryCode: string) {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/2fa/verify-recovery", { challengeToken, recoveryCode });
    applyAuthResponse(data);
  }

  async function forgotPassword(email: string) {
    await apiClient.post("/api/auth/forgot-password", { email });
  }

  async function resetPassword(email: string, token: string, newPassword: string) {
    await apiClient.post("/api/auth/reset-password", { email, token, newPassword });
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUserState(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithGoogle,
        loginWithPassword,
        register,
        verifyTwoFactor,
        verifyRecoveryCode,
        forgotPassword,
        resetPassword,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
