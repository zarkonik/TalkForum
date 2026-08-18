namespace TalkForum.Infrastructure.Admin;

public record AdminUserDto(
    Guid Id,
    string DisplayName,
    string Email,
    string? AvatarUrl,
    bool IsPlatformAdmin,
    bool IsBanned,
    DateTimeOffset CreatedAt);

public record AdminGroupDto(
    Guid Id,
    string Name,
    string CategoryName,
    string OwnerDisplayName,
    int MemberCount,
    DateTimeOffset CreatedAt);
