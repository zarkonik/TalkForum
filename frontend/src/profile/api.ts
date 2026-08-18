import { apiClient } from "../lib/apiClient";
import type { User } from "../auth/types";

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/api/users/me");
  return data;
}

export async function updateDisplayName(displayName: string): Promise<User> {
  const { data } = await apiClient.put<User>("/api/users/me", { displayName });
  return data;
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<User>("/api/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export interface TwoFactorSetup {
  sharedKey: string;
  authenticatorUri: string;
}

export async function setupTwoFactor(): Promise<TwoFactorSetup> {
  const { data } = await apiClient.get<TwoFactorSetup>("/api/auth/2fa/setup");
  return data;
}

export interface RecoveryCodesResponse {
  recoveryCodes: string[];
}

export async function enableTwoFactor(code: string): Promise<RecoveryCodesResponse> {
  const { data } = await apiClient.post<RecoveryCodesResponse>("/api/auth/2fa/enable", { code });
  return data;
}

export async function disableTwoFactor(code: string): Promise<void> {
  await apiClient.post("/api/auth/2fa/disable", { code });
}

export async function regenerateRecoveryCodes(code: string): Promise<RecoveryCodesResponse> {
  const { data } = await apiClient.post<RecoveryCodesResponse>("/api/auth/2fa/recovery-codes/regenerate", { code });
  return data;
}
