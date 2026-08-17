using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace TalkForum.Api.Auth;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? throw new InvalidOperationException("User id claim not found.");
        return Guid.Parse(sub);
    }
}
