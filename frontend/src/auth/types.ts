export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isPlatformAdmin: boolean;
  twoFactorEnabled: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginResponse {
  requiresTwoFactor: boolean;
  challengeToken: string | null;
  token: string | null;
  user: User | null;
}
