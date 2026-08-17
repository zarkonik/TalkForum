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

public enum ServiceErrorType
{
    None,
    NotFound,
    Validation,
    Conflict,
    Forbidden
}

public readonly struct ServiceResult<T>
{
    public bool Success { get; }
    public T? Value { get; }
    public ServiceErrorType ErrorType { get; }
    public string? Error { get; }

    private ServiceResult(bool success, T? value, ServiceErrorType errorType, string? error)
    {
        Success = success;
        Value = value;
        ErrorType = errorType;
        Error = error;
    }

    public static ServiceResult<T> Ok(T value) => new(true, value, ServiceErrorType.None, null);

    public static ServiceResult<T> Fail(ServiceErrorType errorType, string error) =>
        new(false, default, errorType, error);
}

public readonly struct ServiceResult
{
    public bool Success { get; }
    public ServiceErrorType ErrorType { get; }
    public string? Error { get; }

    private ServiceResult(bool success, ServiceErrorType errorType, string? error)
    {
        Success = success;
        ErrorType = errorType;
        Error = error;
    }

    public static ServiceResult Ok() => new(true, ServiceErrorType.None, null);

    public static ServiceResult Fail(ServiceErrorType errorType, string error) =>
        new(false, errorType, error);
}
