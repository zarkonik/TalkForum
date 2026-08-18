import { apiClient } from "../lib/apiClient";
import type { Report } from "./types";

export interface CreateReportInput {
  targetType: number;
  targetId: string;
  reason: string | null;
}

export async function createReport(input: CreateReportInput): Promise<Report> {
  const { data } = await apiClient.post<Report>("/api/reports", input);
  return data;
}

export async function fetchPendingReports(): Promise<Report[]> {
  const { data } = await apiClient.get<Report[]>("/api/admin/reports");
  return data;
}

export async function resolveReport(id: string): Promise<void> {
  await apiClient.post(`/api/admin/reports/${id}/resolve`);
}

export async function dismissReport(id: string): Promise<void> {
  await apiClient.post(`/api/admin/reports/${id}/dismiss`);
}
