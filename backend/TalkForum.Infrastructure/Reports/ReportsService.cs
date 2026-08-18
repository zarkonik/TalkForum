using Microsoft.EntityFrameworkCore;
using TalkForum.Domain.Entities;
using TalkForum.Infrastructure.Admin;
using TalkForum.Infrastructure.Common;

namespace TalkForum.Infrastructure.Reports;

public class ReportsService
{
    private readonly AppDbContext _db;
    private readonly AdminService _adminService;

    public ReportsService(AppDbContext db, AdminService adminService)
    {
        _db = db;
        _adminService = adminService;
    }

    public async Task<ServiceResult<ReportDto>> CreateAsync(Guid reporterUserId, CreateReportRequest request)
    {
        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReporterUserId = reporterUserId,
            TargetType = request.TargetType,
            Reason = request.Reason?.Trim() ?? string.Empty
        };

        string preview;

        switch (request.TargetType)
        {
            case ReportTargetType.Post:
                var post = await _db.Posts.FindAsync(request.TargetId);
                if (post is null)
                {
                    return ServiceResult<ReportDto>.Fail(ServiceErrorType.NotFound, "Post not found.");
                }
                report.PostId = post.Id;
                preview = post.Title;
                break;

            case ReportTargetType.Comment:
                var comment = await _db.Comments.FindAsync(request.TargetId);
                if (comment is null)
                {
                    return ServiceResult<ReportDto>.Fail(ServiceErrorType.NotFound, "Comment not found.");
                }
                report.CommentId = comment.Id;
                preview = comment.Content.Length > 120 ? comment.Content[..120] + "…" : comment.Content;
                break;

            case ReportTargetType.Group:
                var group = await _db.Groups.FindAsync(request.TargetId);
                if (group is null)
                {
                    return ServiceResult<ReportDto>.Fail(ServiceErrorType.NotFound, "Group not found.");
                }
                report.GroupId = group.Id;
                preview = group.Name;
                break;

            default:
                return ServiceResult<ReportDto>.Fail(ServiceErrorType.Validation, "Invalid report target type.");
        }

        _db.Reports.Add(report);
        await _db.SaveChangesAsync();

        var reporter = await _db.Users.FirstAsync(u => u.Id == reporterUserId);

        return ServiceResult<ReportDto>.Ok(new ReportDto(
            report.Id, report.TargetType, request.TargetId, preview, reporterUserId, reporter.DisplayName,
            report.Reason, report.Status, report.CreatedAt));
    }

    public async Task<ServiceResult<IEnumerable<ReportDto>>> GetPendingAsync(Guid adminUserId)
    {
        if (!await _adminService.IsPlatformAdminAsync(adminUserId))
        {
            return ServiceResult<IEnumerable<ReportDto>>.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        var reports = await _db.Reports
            .Include(r => r.Reporter)
            .Include(r => r.Post)
            .Include(r => r.Comment)
            .Include(r => r.Group)
            .Where(r => r.Status == ReportStatus.Pending)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

        var result = reports.Select(r => new ReportDto(
            r.Id, r.TargetType, r.PostId ?? r.CommentId ?? r.GroupId ?? Guid.Empty, BuildPreview(r),
            r.ReporterUserId, r.Reporter!.DisplayName, r.Reason, r.Status, r.CreatedAt));

        return ServiceResult<IEnumerable<ReportDto>>.Ok(result);
    }

    public Task<ServiceResult> ResolveAsync(Guid adminUserId, Guid reportId) =>
        SetStatusAsync(adminUserId, reportId, ReportStatus.Resolved);

    public Task<ServiceResult> DismissAsync(Guid adminUserId, Guid reportId) =>
        SetStatusAsync(adminUserId, reportId, ReportStatus.Dismissed);

    private async Task<ServiceResult> SetStatusAsync(Guid adminUserId, Guid reportId, ReportStatus status)
    {
        if (!await _adminService.IsPlatformAdminAsync(adminUserId))
        {
            return ServiceResult.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        var report = await _db.Reports.FindAsync(reportId);
        if (report is null)
        {
            return ServiceResult.Fail(ServiceErrorType.NotFound, "Report not found.");
        }

        report.Status = status;
        report.ResolvedAt = DateTimeOffset.UtcNow;
        report.ResolvedByUserId = adminUserId;
        await _db.SaveChangesAsync();
        return ServiceResult.Ok();
    }

    private static string BuildPreview(Report r)
    {
        if (r.Post is not null) return r.Post.Title;
        if (r.Comment is not null) return r.Comment.Content.Length > 120 ? r.Comment.Content[..120] + "…" : r.Comment.Content;
        if (r.Group is not null) return r.Group.Name;
        return "(content removed)";
    }
}
