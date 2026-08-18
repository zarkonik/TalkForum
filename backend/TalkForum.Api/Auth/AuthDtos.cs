namespace TalkForum.Api.Auth;

public record GoogleLoginRequest(string IdToken);

public record RegisterRequest(string Email, string Password, string DisplayName);

public record LoginRequest(string Email, string Password);

public record UserDto(Guid Id, string Email, string DisplayName, string? AvatarUrl, bool IsPlatformAdmin, bool TwoFactorEnabled);

public record AuthResponse(string Token, UserDto User);

public record LoginResponse(bool RequiresTwoFactor, string? ChallengeToken, string? Token, UserDto? User);

public record VerifyTwoFactorRequest(string ChallengeToken, string Code);

public record TwoFactorSetupResponse(string SharedKey, string AuthenticatorUri);

public record EnableTwoFactorRequest(string Code);

public record DisableTwoFactorRequest(string Code);

public record EnableTwoFactorResponse(IEnumerable<string> RecoveryCodes);

public record RegenerateRecoveryCodesRequest(string Code);

public record VerifyRecoveryCodeRequest(string ChallengeToken, string RecoveryCode);
