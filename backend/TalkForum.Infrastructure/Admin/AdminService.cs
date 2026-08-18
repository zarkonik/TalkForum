using Microsoft.EntityFrameworkCore;
using TalkForum.Domain.Entities;
using TalkForum.Infrastructure.Common;
using TalkForum.Infrastructure.Groups;
using TalkForum.Infrastructure.Posts;

namespace TalkForum.Infrastructure.Admin;

public class AdminService
{
    private readonly AppDbContext _db;
    private readonly GroupsService _groupsService;
    private readonly PostsService _postsService;
    private readonly CommentsService _commentsService;

    public AdminService(AppDbContext db, GroupsService groupsService, PostsService postsService, CommentsService commentsService)
    {
        _db = db;
        _groupsService = groupsService;
        _postsService = postsService;
        _commentsService = commentsService;
    }

    public async Task<bool> IsPlatformAdminAsync(Guid userId)
    {
        return await _db.Users.AnyAsync(u => u.Id == userId && u.IsPlatformAdmin);
    }

    public async Task<ServiceResult<IEnumerable<AdminUserDto>>> GetUsersAsync(Guid adminUserId)
    {
        if (!await IsPlatformAdminAsync(adminUserId))
        {
            return ServiceResult<IEnumerable<AdminUserDto>>.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        var users = await _db.Users
            .OrderBy(u => u.DisplayName)
            .Select(u => new AdminUserDto(u.Id, u.DisplayName, u.Email!, u.AvatarUrl, u.IsPlatformAdmin, u.IsBanned, u.CreatedAt))
            .ToListAsync();

        return ServiceResult<IEnumerable<AdminUserDto>>.Ok(users);
    }

    public Task<ServiceResult> BanUserAsync(Guid adminUserId, Guid targetUserId) =>
        SetBannedAsync(adminUserId, targetUserId, true);

    public Task<ServiceResult> UnbanUserAsync(Guid adminUserId, Guid targetUserId) =>
        SetBannedAsync(adminUserId, targetUserId, false);

    private async Task<ServiceResult> SetBannedAsync(Guid adminUserId, Guid targetUserId, bool banned)
    {
        if (!await IsPlatformAdminAsync(adminUserId))
        {
            return ServiceResult.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        var target = await _db.Users.FindAsync(targetUserId);
        if (target is null)
        {
            return ServiceResult.Fail(ServiceErrorType.NotFound, "User not found.");
        }

        if (target.IsPlatformAdmin)
        {
            return ServiceResult.Fail(ServiceErrorType.Validation, "Platform admins cannot be banned.");
        }

        target.IsBanned = banned;
        target.BannedAt = banned ? DateTimeOffset.UtcNow : null;
        await _db.SaveChangesAsync();
        return ServiceResult.Ok();
    }

    public async Task<ServiceResult<IEnumerable<AdminGroupDto>>> GetGroupsAsync(Guid adminUserId)
    {
        if (!await IsPlatformAdminAsync(adminUserId))
        {
            return ServiceResult<IEnumerable<AdminGroupDto>>.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        var groups = await _db.Groups
            .Include(g => g.Category)
            .Include(g => g.CreatedByUser)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();

        var groupIds = groups.Select(g => g.Id).ToList();
        var memberCounts = await _db.GroupMemberships
            .Where(m => groupIds.Contains(m.GroupId) && m.Status == MembershipStatus.Approved)
            .GroupBy(m => m.GroupId)
            .Select(g => new { GroupId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.GroupId, x => x.Count);

        var result = groups.Select(g =>
        {
            memberCounts.TryGetValue(g.Id, out var count);
            return new AdminGroupDto(g.Id, g.Name, g.Category!.Name, g.CreatedByUser?.DisplayName ?? "Unknown", count, g.CreatedAt);
        });

        return ServiceResult<IEnumerable<AdminGroupDto>>.Ok(result);
    }

    public async Task<ServiceResult> DeleteGroupAsync(Guid adminUserId, Guid groupId)
    {
        if (!await IsPlatformAdminAsync(adminUserId))
        {
            return ServiceResult.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        return await _groupsService.AdminDeleteGroupAsync(groupId);
    }

    public async Task<ServiceResult> DeletePostAsync(Guid adminUserId, Guid postId)
    {
        if (!await IsPlatformAdminAsync(adminUserId))
        {
            return ServiceResult.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        return await _postsService.AdminDeleteAsync(postId);
    }

    public async Task<ServiceResult> DeleteCommentAsync(Guid adminUserId, Guid commentId)
    {
        if (!await IsPlatformAdminAsync(adminUserId))
        {
            return ServiceResult.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        return await _commentsService.AdminDeleteAsync(commentId);
    }
}
