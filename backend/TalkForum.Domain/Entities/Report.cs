namespace TalkForum.Domain.Entities;

public class Report
{
    public Guid Id { get; set; }
    public Guid ReporterUserId { get; set; }
    public ReportTargetType TargetType { get; set; }
    public Guid? PostId { get; set; }
    public Guid? CommentId { get; set; }
    public Guid? GroupId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public ReportStatus Status { get; set; } = ReportStatus.Pending;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ResolvedAt { get; set; }
    public Guid? ResolvedByUserId { get; set; }

    public ApplicationUser? Reporter { get; set; }
    public Post? Post { get; set; }
    public Comment? Comment { get; set; }
    public Group? Group { get; set; }
    public ApplicationUser? ResolvedByUser { get; set; }
}
