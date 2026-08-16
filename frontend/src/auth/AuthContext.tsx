import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "../lib/apiClient";
import type { AuthResponse, User } from "./types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "talkforum_token";
const USER_KEY = "talkforum_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  function applyAuthResponse(data: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }

  async function loginWithGoogle(idToken: string) {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/google", { idToken });
    applyAuthResponse(data);
  }

  async function loginWithPassword(email: string, password: string) {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/login", { email, password });
    applyAuthResponse(data);
  }

  async function register(email: string, password: string, displayName: string) {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/register", {
      email,
      password,
      displayName,
    });
    applyAuthResponse(data);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, loginWithGoogle, loginWithPassword, register, logout }}
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
