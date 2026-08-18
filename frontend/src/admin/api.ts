import { apiClient } from "../lib/apiClient";
import type { AdminGroup, AdminUser } from "./types";

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<AdminUser[]>("/api/admin/users");
  return data;
}

export async function banUser(id: string): Promise<void> {
  await apiClient.post(`/api/admin/users/${id}/ban`);
}

export async function unbanUser(id: string): Promise<void> {
  await apiClient.post(`/api/admin/users/${id}/unban`);
}

export async function fetchAdminGroups(): Promise<AdminGroup[]> {
  const { data } = await apiClient.get<AdminGroup[]>("/api/admin/groups");
  return data;
}

export async function adminDeleteGroup(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/groups/${id}`);
}

export async function adminDeletePost(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/posts/${id}`);
}

export async function adminDeleteComment(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/comments/${id}`);
}
