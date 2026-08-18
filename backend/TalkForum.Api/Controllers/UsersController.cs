using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalkForum.Api.Auth;
using TalkForum.Domain.Entities;
using TalkForum.Infrastructure.Users;

namespace TalkForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp"
    };

    private const long MaxAvatarSizeBytes = 5 * 1024 * 1024;

    private readonly ProfileService _profileService;
    private readonly IWebHostEnvironment _env;

    public UsersController(ProfileService profileService, IWebHostEnvironment env)
    {
        _profileService = profileService;
        _env = env;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var result = await _profileService.GetByIdAsync(User.GetUserId());
        return result.Success ? Ok(ToDto(result.Value!)) : NotFound();
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> UpdateMe(UpdateProfileRequest request)
    {
        var result = await _profileService.UpdateDisplayNameAsync(User.GetUserId(), request.DisplayName);
        return result.Success ? Ok(ToDto(result.Value!)) : BadRequest(new { message = result.Error });
    }

    [HttpPost("me/avatar")]
    public async Task<ActionResult<UserDto>> UploadAvatar([FromForm] IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "File is required." });
        }

        if (file.Length > MaxAvatarSizeBytes)
        {
            return BadRequest(new { message = "File too large (max 5MB)." });
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            return BadRequest(new { message = "Only JPEG, PNG or WEBP images are allowed." });
        }

        var userId = User.GetUserId();
        var webRootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var avatarsDir = Path.Combine(webRootPath, "avatars");
        Directory.CreateDirectory(avatarsDir);

        foreach (var existingFile in Directory.GetFiles(avatarsDir, $"{userId}.*"))
        {
            System.IO.File.Delete(existingFile);
        }

        var extension = Path.GetExtension(file.FileName);
        var fileName = $"{userId}{extension}";
        var filePath = Path.Combine(avatarsDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var result = await _profileService.UpdateAvatarAsync(userId, $"/avatars/{fileName}");
        return result.Success ? Ok(ToDto(result.Value!)) : NotFound();
    }

    private static UserDto ToDto(ApplicationUser user) => new(user.Id, user.Email!, user.DisplayName, user.AvatarUrl);
}

public record UpdateProfileRequest(string DisplayName);
