using Microsoft.EntityFrameworkCore;
using TalkForum.Domain.Entities;

namespace TalkForum.Infrastructure.Groups;

public class GroupsService
{
    private readonly AppDbContext _db;

    public GroupsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ServiceResult<GroupSummaryDto>> CreateAsync(Guid userId, CreateGroupRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return ServiceResult<GroupSummaryDto>.Fail(ServiceErrorType.Validation, "Name is required.");
        }

        var category = await _db.Categories.FindAsync(request.CategoryId);
        if (category is null)
        {
            return ServiceResult<GroupSummaryDto>.Fail(ServiceErrorType.Validation, "Category not found.");
        }

        if (request.ParentGroupId is not null)
        {
            var parent = await _db.Groups.FindAsync(request.ParentGroupId.Value);
            if (parent is null)
            {
                return ServiceResult<GroupSummaryDto>.Fail(ServiceErrorType.Validation, "Parent group not found.");
            }

            if (parent.ParentGroupId is not null)
            {
                return ServiceResult<GroupSummaryDto>.Fail(ServiceErrorType.Validation, "Subgroups can only be one level deep.");
            }
        }

        var slug = await GenerateUniqueSlugAsync(request.Name);

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description.Trim(),
            CategoryId = request.CategoryId,
            ParentGroupId = request.ParentGroupId,
            CreatedByUserId = userId
        };

        _db.Groups.Add(group);
        _db.GroupMemberships.Add(new GroupMembership
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            UserId = userId,
            Role = GroupRole.Owner,
            Status = MembershipStatus.Approved,
            DecidedAt = DateTimeOffset.UtcNow,
            DecidedByUserId = userId
        });

        await _db.SaveChangesAsync();

        var dto = new GroupSummaryDto(
            group.Id, group.Name, group.Slug, group.Description, group.CategoryId, category.Name,
            group.ParentGroupId, 1, group.CreatedAt, MembershipStatus.Approved, GroupRole.Owner);

        return ServiceResult<GroupSummaryDto>.Ok(dto);
    }

    public async Task<IEnumerable<GroupSummaryDto>> GetAllAsync(Guid userId, Guid? categoryId, string? search)
    {
        var query = _db.Groups.Include(g => g.Category).AsQueryable();

        if (categoryId is not null)
        {
            query = query.Where(g => g.CategoryId == categoryId);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(g => EF.Functions.ILike(g.Name, $"%{search}%"));
        }

        var groups = await query.OrderByDescending(g => g.CreatedAt).ToListAsync();
        var groupIds = groups.Select(g => g.Id).ToList();

        var memberCounts = await _db.GroupMemberships
            .Where(m => groupIds.Contains(m.GroupId) && m.Status == MembershipStatus.Approved)
            .GroupBy(m => m.GroupId)
            .Select(g => new { GroupId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.GroupId, x => x.Count);

        var viewerMemberships = await _db.GroupMemberships
            .Where(m => groupIds.Contains(m.GroupId) && m.UserId == userId)
            .ToDictionaryAsync(m => m.GroupId, m => m);

        return groups.Select(g =>
        {
            viewerMemberships.TryGetValue(g.Id, out var membership);
            memberCounts.TryGetValue(g.Id, out var count);

            return new GroupSummaryDto(
                g.Id, g.Name, g.Slug, g.Description, g.CategoryId, g.Category!.Name,
                g.ParentGroupId, count, g.CreatedAt, membership?.Status, membership?.Role);
        });
    }

    public async Task<ServiceResult<GroupSummaryDto>> GetByIdAsync(Guid userId, Guid groupId)
    {
        var group = await _db.Groups.Include(g => g.Category).FirstOrDefaultAsync(g => g.Id == groupId);
        if (group is null)
        {
            return ServiceResult<GroupSummaryDto>.Fail(ServiceErrorType.NotFound, "Group not found.");
        }

        var memberCount = await _db.GroupMemberships.CountAsync(m => m.GroupId == groupId && m.Status == MembershipStatus.Approved);
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId);

        var dto = new GroupSummaryDto(
            group.Id, group.Name, group.Slug, group.Description, group.CategoryId, group.Category!.Name,
            group.ParentGroupId, memberCount, group.CreatedAt, membership?.Status, membership?.Role);

        return ServiceResult<GroupSummaryDto>.Ok(dto);
    }

    public async Task<ServiceResult> RequestToJoinAsync(Guid userId, Guid groupId)
    {
        var groupExists = await _db.Groups.AnyAsync(g => g.Id == groupId);
        if (!groupExists)
        {
            return ServiceResult.Fail(ServiceErrorType.NotFound, "Group not found.");
        }

        var existing = await _db.GroupMemberships.FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId);
        if (existing is not null)
        {
            return ServiceResult.Fail(ServiceErrorType.Conflict, $"A membership or request already exists ({existing.Status}).");
        }

        _db.GroupMemberships.Add(new GroupMembership
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            UserId = userId,
            Role = GroupRole.Member,
            Status = MembershipStatus.Pending
        });

        await _db.SaveChangesAsync();
        return ServiceResult.Ok();
    }

    public async Task<ServiceResult<IEnumerable<MembershipRequestDto>>> GetPendingRequestsAsync(Guid requestingUserId, Guid groupId)
    {
        if (!await IsModeratorOrOwnerAsync(groupId, requestingUserId))
        {
            return ServiceResult<IEnumerable<MembershipRequestDto>>.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        var requests = await _db.GroupMemberships
            .Include(m => m.User)
            .Where(m => m.GroupId == groupId && m.Status == MembershipStatus.Pending)
            .OrderBy(m => m.RequestedAt)
            .Select(m => new MembershipRequestDto(m.UserId, m.User!.DisplayName, m.User.Email!, m.User.AvatarUrl, m.RequestedAt))
            .ToListAsync();

        return ServiceResult<IEnumerable<MembershipRequestDto>>.Ok(requests);
    }

    public Task<ServiceResult> ApproveRequestAsync(Guid decidingUserId, Guid groupId, Guid targetUserId) =>
        DecideRequestAsync(decidingUserId, groupId, targetUserId, MembershipStatus.Approved);

    public Task<ServiceResult> RejectRequestAsync(Guid decidingUserId, Guid groupId, Guid targetUserId) =>
        DecideRequestAsync(decidingUserId, groupId, targetUserId, MembershipStatus.Rejected);

    private async Task<ServiceResult> DecideRequestAsync(Guid decidingUserId, Guid groupId, Guid targetUserId, MembershipStatus decision)
    {
        if (!await IsModeratorOrOwnerAsync(groupId, decidingUserId))
        {
            return ServiceResult.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == targetUserId);
        if (membership is null || membership.Status != MembershipStatus.Pending)
        {
            return ServiceResult.Fail(ServiceErrorType.NotFound, "Pending request not found.");
        }

        membership.Status = decision;
        membership.DecidedAt = DateTimeOffset.UtcNow;
        membership.DecidedByUserId = decidingUserId;

        await _db.SaveChangesAsync();
        return ServiceResult.Ok();
    }

    private async Task<bool> IsModeratorOrOwnerAsync(Guid groupId, Guid userId)
    {
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId);
        return membership is not null
            && membership.Status == MembershipStatus.Approved
            && (membership.Role == GroupRole.Owner || membership.Role == GroupRole.Moderator);
    }

    private async Task<string> GenerateUniqueSlugAsync(string name)
    {
        var baseSlug = SlugGenerator.Slugify(name);
        var slug = baseSlug;
        var suffix = 2;

        while (await _db.Groups.AnyAsync(g => g.Slug == slug))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return slug;
    }
}
