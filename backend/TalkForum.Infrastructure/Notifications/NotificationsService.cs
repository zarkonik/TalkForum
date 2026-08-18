using Microsoft.EntityFrameworkCore;
using TalkForum.Domain.Entities;
using TalkForum.Infrastructure.Common;

namespace TalkForum.Infrastructure.Notifications;

public class NotificationsService
{
    private readonly AppDbContext _db;

    public NotificationsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task NotifyAsync(Guid recipientUserId, Guid actorUserId, NotificationType type, Guid? groupId = null, Guid? postId = null, Guid? commentId = null)
    {
        if (recipientUserId == actorUserId)
        {
            return;
        }

        _db.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            RecipientUserId = recipientUserId,
            ActorUserId = actorUserId,
            Type = type,
            GroupId = groupId,
            PostId = postId,
            CommentId = commentId
        });

        await _db.SaveChangesAsync();
    }

    public async Task<IEnumerable<NotificationDto>> GetForUserAsync(Guid userId)
    {
        var notifications = await _db.Notifications
            .Include(n => n.Actor)
            .Include(n => n.Group)
            .Where(n => n.RecipientUserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();

        return notifications.Select(n => new NotificationDto(
            n.Id, n.Type, BuildMessage(n), n.ActorUserId, n.Actor!.DisplayName, n.Actor.AvatarUrl,
            n.GroupId, n.Group?.Name, n.PostId, n.CommentId, n.IsRead, n.CreatedAt));
    }

    private static string BuildMessage(Notification n)
    {
        var actor = n.Actor!.DisplayName;
        return n.Type switch
        {
            NotificationType.PostLiked => $"{actor} liked your post.",
            NotificationType.CommentLiked => $"{actor} liked your comment.",
            NotificationType.CommentReplied => $"{actor} replied to your comment.",
            NotificationType.GroupMembershipApproved => $"{actor} approved your request to join {n.Group?.Name}.",
            NotificationType.GroupMembershipRejected => $"{actor} rejected your request to join {n.Group?.Name}.",
            NotificationType.PostCreatedInGroup => $"{actor} created a new post in {n.Group?.Name}.",
            _ => $"{actor} did something."
        };
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _db.Notifications.CountAsync(n => n.RecipientUserId == userId && !n.IsRead);
    }

    public async Task<ServiceResult> MarkAsReadAsync(Guid userId, Guid notificationId)
    {
        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId);
        if (notification is null)
        {
            return ServiceResult.Fail(ServiceErrorType.NotFound, "Notification not found.");
        }

        if (notification.RecipientUserId != userId)
        {
            return ServiceResult.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        notification.IsRead = true;
        await _db.SaveChangesAsync();
        return ServiceResult.Ok();
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        await _db.Notifications
            .Where(n => n.RecipientUserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsRead, true));
    }
}
