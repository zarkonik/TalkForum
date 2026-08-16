namespace TalkForum.Api.Auth;

public record GoogleLoginRequest(string IdToken);

public record RegisterRequest(string Email, string Password, string DisplayName);

public record LoginRequest(string Email, string Password);

public record UserDto(Guid Id, string Email, string DisplayName, string? AvatarUrl);

public record AuthResponse(string Token, UserDto User);
