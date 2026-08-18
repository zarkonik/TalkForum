import { apiClient } from "../lib/apiClient";
import type { Notification, UnreadCount } from "./types";

export async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await apiClient.get<Notification[]>("/api/notifications");
  return data;
}

export async function fetchUnreadCount(): Promise<UnreadCount> {
  const { data } = await apiClient.get<UnreadCount>("/api/notifications/unread-count");
  return data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient.post(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.post("/api/notifications/read-all");
}
