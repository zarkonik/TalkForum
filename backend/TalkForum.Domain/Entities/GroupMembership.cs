namespace TalkForum.Domain.Entities;

public class GroupMembership
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    public GroupRole Role { get; set; } = GroupRole.Member;
    public MembershipStatus Status { get; set; } = MembershipStatus.Pending;
    public DateTimeOffset RequestedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DecidedAt { get; set; }
    public Guid? DecidedByUserId { get; set; }

    public Group? Group { get; set; }
    public ApplicationUser? User { get; set; }
    public ApplicationUser? DecidedByUser { get; set; }
}
