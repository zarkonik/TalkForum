namespace TalkForum.Domain.Entities;

public class CommentLike
{
    public Guid Id { get; set; }
    public Guid CommentId { get; set; }
    public Guid UserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Comment? Comment { get; set; }
    public ApplicationUser? User { get; set; }
}
