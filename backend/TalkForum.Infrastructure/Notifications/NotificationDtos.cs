using TalkForum.Domain.Entities;

namespace TalkForum.Infrastructure.Notifications;

public record NotificationDto(
    Guid Id,
    NotificationType Type,
    string Message,
    Guid ActorUserId,
    string ActorDisplayName,
    string? ActorAvatarUrl,
    Guid? GroupId,
    string? GroupName,
    Guid? PostId,
    Guid? CommentId,
    bool IsRead,
    DateTimeOffset CreatedAt);

public record UnreadCountDto(int Count);
