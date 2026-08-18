using System.Security.Cryptography;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TalkForum.Api.Auth;
using TalkForum.Domain.Entities;
using TalkForum.Infrastructure.Auth;
using TalkForum.Infrastructure.Email;

namespace TalkForum.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TokenService _tokenService;
    private readonly GoogleAuthOptions _googleOptions;
    private readonly IEmailSender _emailSender;
    private readonly EmailOptions _emailOptions;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        TokenService tokenService,
        IOptions<GoogleAuthOptions> googleOptions,
        IEmailSender emailSender,
        IOptions<EmailOptions> emailOptions,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _googleOptions = googleOptions.Value;
        _emailSender = emailSender;
        _emailOptions = emailOptions.Value;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register(RegisterRequest request)
    {
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            return Conflict(new { message = "Email already in use." });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(ToLoginResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (user.IsBanned)
        {
            return StatusCode(403, new { message = "This account has been banned." });
        }

        return Ok(ToLoginResponse(user));
    }

    [HttpPost("google")]
    public async Task<ActionResult<LoginResponse>> GoogleLogin(GoogleLoginRequest request)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_googleOptions.ClientId]
            });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(new { message = "Invalid Google token." });
        }

        var user = await _userManager.FindByEmailAsync(payload.Email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = payload.Email,
                Email = payload.Email,
                EmailConfirmed = payload.EmailVerified,
                DisplayName = payload.Name,
                AvatarUrl = payload.Picture
            };

            var result = await _userManager.CreateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
            }
        }

        if (user.IsBanned)
        {
            return StatusCode(403, new { message = "This account has been banned." });
        }

        return Ok(ToLoginResponse(user));
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is not null && !user.IsBanned)
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encodedToken = Uri.EscapeDataString(token);
            var encodedEmail = Uri.EscapeDataString(user.Email!);
            var resetLink = $"{_emailOptions.FrontendBaseUrl}/reset-password?email={encodedEmail}&token={encodedToken}";

            var html = $"""
                <p>Hi {user.DisplayName},</p>
                <p>We received a request to reset your TalkForum password. Click the link below to choose a new one:</p>
                <p><a href="{resetLink}">Reset your password</a></p>
                <p>If you didn't request this, you can safely ignore this email. This link expires soon for your security.</p>
                """;

            try
            {
                await _emailSender.SendAsync(user.Email!, "Reset your TalkForum password", html);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to user {UserId}.", user.Id);
            }
        }

        // Always return 200 so we don't reveal whether an email address is registered.
        return Ok(new { message = "If that email is registered, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return BadRequest(new { message = "Invalid or expired reset link." });
        }

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(new { message = "Password reset successfully." });
    }

    [HttpPost("2fa/verify")]
    public async Task<ActionResult<AuthResponse>> VerifyTwoFactor(VerifyTwoFactorRequest request)
    {
        var userId = _tokenService.ValidateTwoFactorChallengeToken(request.ChallengeToken);
        if (userId is null)
        {
            return Unauthorized(new { message = "Invalid or expired challenge." });
        }

        var user = await _userManager.FindByIdAsync(userId.Value.ToString());
        if (user is null || user.IsBanned)
        {
            return Unauthorized(new { message = "Invalid challenge." });
        }

        await LogTotpDiagnosticsAsync(user, request.Code);

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, request.Code);
        if (!isValid)
        {
            return Unauthorized(new { message = "Invalid authenticator code." });
        }

        return Ok(ToAuthResponse(user));
    }

    [HttpPost("2fa/verify-recovery")]
    public async Task<ActionResult<AuthResponse>> VerifyRecoveryCode(VerifyRecoveryCodeRequest request)
    {
        var userId = _tokenService.ValidateTwoFactorChallengeToken(request.ChallengeToken);
        if (userId is null)
        {
            return Unauthorized(new { message = "Invalid or expired challenge." });
        }

        var user = await _userManager.FindByIdAsync(userId.Value.ToString());
        if (user is null || user.IsBanned)
        {
            return Unauthorized(new { message = "Invalid challenge." });
        }

        var result = await _userManager.RedeemTwoFactorRecoveryCodeAsync(user, request.RecoveryCode);
        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Invalid recovery code." });
        }

        return Ok(ToAuthResponse(user));
    }

    [Authorize]
    [HttpGet("2fa/setup")]
    public async Task<ActionResult<TwoFactorSetupResponse>> SetupTwoFactor()
    {
        var user = await _userManager.FindByIdAsync(User.GetUserId().ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        var key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            key = await _userManager.GetAuthenticatorKeyAsync(user);
        }

        var uri = $"otpauth://totp/TalkForum:{Uri.EscapeDataString(user.Email!)}?secret={key}&issuer=TalkForum&digits=6";
        return Ok(new TwoFactorSetupResponse(key!, uri));
    }

    [Authorize]
    [HttpPost("2fa/enable")]
    public async Task<ActionResult<EnableTwoFactorResponse>> EnableTwoFactor(EnableTwoFactorRequest request)
    {
        var user = await _userManager.FindByIdAsync(User.GetUserId().ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        await LogTotpDiagnosticsAsync(user, request.Code);

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, request.Code);
        if (!isValid)
        {
            return BadRequest(new { message = "Invalid authenticator code." });
        }

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);

        return Ok(new EnableTwoFactorResponse(recoveryCodes ?? Enumerable.Empty<string>()));
    }

    [Authorize]
    [HttpPost("2fa/recovery-codes/regenerate")]
    public async Task<ActionResult<EnableTwoFactorResponse>> RegenerateRecoveryCodes(RegenerateRecoveryCodesRequest request)
    {
        var user = await _userManager.FindByIdAsync(User.GetUserId().ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, request.Code);
        if (!isValid)
        {
            return BadRequest(new { message = "Invalid authenticator code." });
        }

        var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);
        return Ok(new EnableTwoFactorResponse(recoveryCodes ?? Enumerable.Empty<string>()));
    }

    [Authorize]
    [HttpPost("2fa/disable")]
    public async Task<IActionResult> DisableTwoFactor(DisableTwoFactorRequest request)
    {
        var user = await _userManager.FindByIdAsync(User.GetUserId().ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, request.Code);
        if (!isValid)
        {
            return BadRequest(new { message = "Invalid authenticator code." });
        }

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        return NoContent();
    }

    private LoginResponse ToLoginResponse(ApplicationUser user)
    {
        if (user.TwoFactorEnabled)
        {
            return new LoginResponse(true, _tokenService.CreateTwoFactorChallengeToken(user), null, null);
        }

        var auth = ToAuthResponse(user);
        return new LoginResponse(false, null, auth.Token, auth.User);
    }

    private AuthResponse ToAuthResponse(ApplicationUser user)
    {
        var token = _tokenService.CreateAccessToken(user);
        return new AuthResponse(token, new UserDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl, user.IsPlatformAdmin, user.TwoFactorEnabled));
    }

    private async Task LogTotpDiagnosticsAsync(ApplicationUser user, string submittedCode)
    {
        try
        {
            var key = await _userManager.GetAuthenticatorKeyAsync(user);
            if (string.IsNullOrEmpty(key))
            {
                _logger.LogWarning("2FA diagnostics: user {UserId} has no authenticator key set.", user.Id);
                return;
            }

            var keyBytes = Base32Decode(key);
            var nowUtc = DateTimeOffset.UtcNow;
            var currentStep = nowUtc.ToUnixTimeSeconds() / 30;

            var windowCodes = new List<string>();
            for (var offset = -5; offset <= 5; offset++)
            {
                var code = ComputeTotp(keyBytes, currentStep + offset);
                windowCodes.Add($"[{offset * 30:+0;-0;0}s]={code}");
            }

            var matchOffset = Enumerable.Range(-5, 11)
                .Select(o => (offset: o - 5, code: ComputeTotp(keyBytes, currentStep + (o - 5))))
                .Where(x => x.code == submittedCode)
                .Select(x => (int?)x.offset)
                .FirstOrDefault();

            _logger.LogWarning(
                "2FA diagnostics: user={UserId} serverUtcNow={Now} submittedCode={Submitted} matchedAtOffsetSeconds={MatchOffset} windowCodes={Windows}",
                user.Id, nowUtc, submittedCode, matchOffset.HasValue ? matchOffset.Value * 30 : (int?)null, string.Join(" ", windowCodes));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "2FA diagnostics failed for user {UserId}.", user.Id);
        }
    }

    private static string ComputeTotp(byte[] key, long counter)
    {
        var counterBytes = BitConverter.GetBytes(counter);
        if (BitConverter.IsLittleEndian)
        {
            Array.Reverse(counterBytes);
        }

        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(counterBytes);
        var offset = hash[^1] & 0xf;
        var binaryCode = ((hash[offset] & 0x7f) << 24)
            | ((hash[offset + 1] & 0xff) << 16)
            | ((hash[offset + 2] & 0xff) << 8)
            | (hash[offset + 3] & 0xff);
        var otp = binaryCode % 1000000;
        return otp.ToString("D6");
    }

    private static byte[] Base32Decode(string input)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        input = input.TrimEnd('=').ToUpperInvariant();

        var bits = new System.Text.StringBuilder();
        foreach (var c in input)
        {
            var val = alphabet.IndexOf(c);
            if (val < 0)
            {
                continue;
            }
            bits.Append(Convert.ToString(val, 2).PadLeft(5, '0'));
        }

        var byteCount = bits.Length / 8;
        var bytes = new byte[byteCount];
        for (var i = 0; i < byteCount; i++)
        {
            bytes[i] = Convert.ToByte(bits.ToString(i * 8, 8), 2);
        }

        return bytes;
    }
}
