export const NOTIFICATION_TYPE = {
  POST_LIKED: 0,
  COMMENT_LIKED: 1,
  COMMENT_REPLIED: 2,
  GROUP_MEMBERSHIP_APPROVED: 3,
  GROUP_MEMBERSHIP_REJECTED: 4,
} as const;

export interface Notification {
  id: string;
  type: number;
  message: string;
  actorUserId: string;
  actorDisplayName: string;
  actorAvatarUrl: string | null;
  groupId: string | null;
  groupName: string | null;
  postId: string | null;
  commentId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}
