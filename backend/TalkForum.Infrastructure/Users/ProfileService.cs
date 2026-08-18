using Microsoft.AspNetCore.Identity;
using TalkForum.Domain.Entities;
using TalkForum.Infrastructure.Common;

namespace TalkForum.Infrastructure.Users;

public class ProfileService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public ProfileService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<ServiceResult<ApplicationUser>> GetByIdAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        return user is null
            ? ServiceResult<ApplicationUser>.Fail(ServiceErrorType.NotFound, "User not found.")
            : ServiceResult<ApplicationUser>.Ok(user);
    }

    public async Task<ServiceResult<ApplicationUser>> UpdateAvatarAsync(Guid userId, string avatarUrl)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return ServiceResult<ApplicationUser>.Fail(ServiceErrorType.NotFound, "User not found.");
        }

        user.AvatarUrl = avatarUrl;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return ServiceResult<ApplicationUser>.Fail(ServiceErrorType.Validation, string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return ServiceResult<ApplicationUser>.Ok(user);
    }
}
