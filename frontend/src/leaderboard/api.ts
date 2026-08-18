import { apiClient } from "../lib/apiClient";
import type { LeaderboardEntry } from "./types";

export async function fetchGroupLeaderboard(groupId: string): Promise<LeaderboardEntry[]> {
  const { data } = await apiClient.get<LeaderboardEntry[]>(`/api/groups/${groupId}/leaderboard`);
  return data;
}
