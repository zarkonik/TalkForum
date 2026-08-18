import { NOTIFICATION_TYPE, type Notification } from "./types";

export function getNotificationLink(n: Notification): string | null {
  switch (n.type) {
    case NOTIFICATION_TYPE.POST_LIKED:
    case NOTIFICATION_TYPE.COMMENT_LIKED:
    case NOTIFICATION_TYPE.COMMENT_REPLIED:
      return n.postId ? `/posts/${n.postId}` : null;
    case NOTIFICATION_TYPE.GROUP_MEMBERSHIP_APPROVED:
    case NOTIFICATION_TYPE.GROUP_MEMBERSHIP_REJECTED:
      return n.groupId ? `/groups/${n.groupId}` : null;
    default:
      return null;
  }
}
