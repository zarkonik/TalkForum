using TalkForum.Domain.Entities;

namespace TalkForum.Infrastructure.Reports;

public record CreateReportRequest(ReportTargetType TargetType, Guid TargetId, string? Reason);

public record ReportDto(
    Guid Id,
    ReportTargetType TargetType,
    Guid TargetId,
    string TargetPreview,
    Guid ReporterUserId,
    string ReporterDisplayName,
    string? Reason,
    ReportStatus Status,
    DateTimeOffset CreatedAt);
