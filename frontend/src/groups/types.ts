export interface Category {
  id: string;
  name: string;
  slug: string;
}

export type MembershipStatus = "Pending" | "Approved" | "Rejected" | 0 | 1 | 2;
export type GroupRole = "Member" | "Moderator" | "Owner" | 0 | 1 | 2;

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  parentGroupId: string | null;
  memberCount: number;
  createdAt: string;
  viewerMembershipStatus: number | null;
  viewerRole: number | null;
}

export interface MembershipRequest {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  requestedAt: string;
}

export const MEMBERSHIP_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
} as const;

export const GROUP_ROLE = {
  MEMBER: 0,
  MODERATOR: 1,
  OWNER: 2,
} as const;
