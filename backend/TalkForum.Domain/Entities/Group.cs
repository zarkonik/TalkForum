namespace TalkForum.Domain.Entities;

public class Group
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Guid? ParentGroupId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Category? Category { get; set; }
    public Group? ParentGroup { get; set; }
    public ApplicationUser? CreatedByUser { get; set; }
    public ICollection<Group> SubGroups { get; set; } = new List<Group>();
    public ICollection<GroupMembership> Memberships { get; set; } = new List<GroupMembership>();
    public ICollection<Post> Posts { get; set; } = new List<Post>();
}
