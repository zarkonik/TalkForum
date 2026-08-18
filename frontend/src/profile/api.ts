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
