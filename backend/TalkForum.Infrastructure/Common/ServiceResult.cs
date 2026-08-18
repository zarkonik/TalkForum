namespace TalkForum.Infrastructure.Common;

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
