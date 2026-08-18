using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TalkForum.Domain.Entities;

namespace TalkForum.Infrastructure.Auth;

public class TokenService
{
    private const string TwoFactorPurposeClaim = "purpose";
    private const string TwoFactorPurposeValue = "2fa_challenge";

    private readonly JwtOptions _options;
    private readonly ILogger<TokenService> _logger;

    public TokenService(IOptions<JwtOptions> options, ILogger<TokenService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public string CreateAccessToken(ApplicationUser user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new("displayName", user.DisplayName),
            new("isPlatformAdmin", user.IsPlatformAdmin ? "true" : "false"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        return WriteToken(claims, TimeSpan.FromMinutes(_options.ExpiryMinutes));
    }

    public string CreateTwoFactorChallengeToken(ApplicationUser user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(TwoFactorPurposeClaim, TwoFactorPurposeValue),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        return WriteToken(claims, TimeSpan.FromMinutes(5));
    }

    public Guid? ValidateTwoFactorChallengeToken(string token)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };

        try
        {
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _options.Issuer,
                ValidateAudience = true,
                ValidAudience = _options.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            }, out _);

            var purpose = principal.FindFirstValue(TwoFactorPurposeClaim);
            if (purpose != TwoFactorPurposeValue)
            {
                _logger.LogWarning("2FA challenge token purpose claim mismatch: {Purpose}", purpose);
                return null;
            }

            var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (sub is null)
            {
                _logger.LogWarning("2FA challenge token missing sub claim.");
                return null;
            }

            return Guid.Parse(sub);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "2FA challenge token validation failed. ServerUtcNow={Now}", DateTimeOffset.UtcNow);
            return null;
        }
    }

    private string WriteToken(List<Claim> claims, TimeSpan lifetime)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: DateTime.UtcNow.Add(lifetime),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
