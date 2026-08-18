namespace TalkForum.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid RecipientUserId { get; set; }
    public Guid ActorUserId { get; set; }
    public NotificationType Type { get; set; }
    public Guid? GroupId { get; set; }
    public Guid? PostId { get; set; }
    public Guid? CommentId { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ApplicationUser? Recipient { get; set; }
    public ApplicationUser? Actor { get; set; }
    public Group? Group { get; set; }
    public Post? Post { get; set; }
    public Comment? Comment { get; set; }
}
