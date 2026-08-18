using TalkForum.Domain.Entities;

namespace TalkForum.Infrastructure.Groups;

public record CreateGroupRequest(string Name, string Description, Guid CategoryId, Guid? ParentGroupId);

public record GroupSummaryDto(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    Guid CategoryId,
    string CategoryName,
    Guid? ParentGroupId,
    int MemberCount,
    DateTimeOffset CreatedAt,
    MembershipStatus? ViewerMembershipStatus,
    GroupRole? ViewerRole);

public record MembershipRequestDto(
    Guid UserId,
    string DisplayName,
    string Email,
    string? AvatarUrl,
    DateTimeOffset RequestedAt);

public record GroupMemberDto(
    Guid UserId,
    string DisplayName,
    string Email,
    string? AvatarUrl,
    GroupRole Role,
    DateTimeOffset JoinedAt);
