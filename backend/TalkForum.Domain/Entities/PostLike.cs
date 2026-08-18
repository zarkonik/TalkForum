namespace TalkForum.Domain.Entities;

public class PostLike
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Post? Post { get; set; }
    public ApplicationUser? User { get; set; }
}
