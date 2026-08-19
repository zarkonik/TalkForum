namespace TalkForum.Domain.Entities;

public enum NotificationType
{
    PostLiked = 0,
    CommentLiked = 1,
    CommentReplied = 2,
    GroupMembershipApproved = 3,
    GroupMembershipRejected = 4,
    PostCreatedInGroup = 5,
    GroupJoinRequested = 6
}
