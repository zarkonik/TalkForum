import { apiClient } from "../lib/apiClient";
import type { Category, Group, MembershipRequest } from "./types";

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/api/categories");
  return data;
}

export async function fetchGroups(params: { categoryId?: string; search?: string }): Promise<Group[]> {
  const { data } = await apiClient.get<Group[]>("/api/groups", { params });
  return data;
}

export async function fetchGroup(id: string): Promise<Group> {
  const { data } = await apiClient.get<Group>(`/api/groups/${id}`);
  return data;
}

export interface CreateGroupInput {
  name: string;
  description: string;
  categoryId: string;
  parentGroupId: string | null;
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const { data } = await apiClient.post<Group>("/api/groups", input);
  return data;
}

export async function requestToJoinGroup(id: string): Promise<void> {
  await apiClient.post(`/api/groups/${id}/join`);
}

export async function fetchMembershipRequests(id: string): Promise<MembershipRequest[]> {
  const { data } = await apiClient.get<MembershipRequest[]>(`/api/groups/${id}/requests`);
  return data;
}

export async function approveMembershipRequest(groupId: string, userId: string): Promise<void> {
  await apiClient.post(`/api/groups/${groupId}/requests/${userId}/approve`);
}

export async function rejectMembershipRequest(groupId: string, userId: string): Promise<void> {
  await apiClient.post(`/api/groups/${groupId}/requests/${userId}/reject`);
}
