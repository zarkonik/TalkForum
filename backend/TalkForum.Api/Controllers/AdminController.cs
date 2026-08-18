using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalkForum.Api.Auth;
using TalkForum.Infrastructure.Admin;
using TalkForum.Infrastructure.Common;
using TalkForum.Infrastructure.Reports;

namespace TalkForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AdminService _adminService;
    private readonly ReportsService _reportsService;

    public AdminController(AdminService adminService, ReportsService reportsService)
    {
        _adminService = adminService;
        _reportsService = reportsService;
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers()
    {
        var result = await _adminService.GetUsersAsync(User.GetUserId());
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPost("users/{id:guid}/ban")]
    public async Task<IActionResult> BanUser(Guid id)
    {
        var result = await _adminService.BanUserAsync(User.GetUserId(), id);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPost("users/{id:guid}/unban")]
    public async Task<IActionResult> UnbanUser(Guid id)
    {
        var result = await _adminService.UnbanUserAsync(User.GetUserId(), id);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpGet("groups")]
    public async Task<ActionResult<IEnumerable<AdminGroupDto>>> GetGroups()
    {
        var result = await _adminService.GetGroupsAsync(User.GetUserId());
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpDelete("groups/{id:guid}")]
    public async Task<IActionResult> DeleteGroup(Guid id)
    {
        var result = await _adminService.DeleteGroupAsync(User.GetUserId(), id);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpDelete("posts/{id:guid}")]
    public async Task<IActionResult> DeletePost(Guid id)
    {
        var result = await _adminService.DeletePostAsync(User.GetUserId(), id);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpDelete("comments/{id:guid}")]
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        var result = await _adminService.DeleteCommentAsync(User.GetUserId(), id);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpGet("reports")]
    public async Task<ActionResult<IEnumerable<ReportDto>>> GetReports()
    {
        var result = await _reportsService.GetPendingAsync(User.GetUserId());
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPost("reports/{id:guid}/resolve")]
    public async Task<IActionResult> ResolveReport(Guid id)
    {
        var result = await _reportsService.ResolveAsync(User.GetUserId(), id);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPost("reports/{id:guid}/dismiss")]
    public async Task<IActionResult> DismissReport(Guid id)
    {
        var result = await _reportsService.DismissAsync(User.GetUserId(), id);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    private ActionResult ToErrorResult(ServiceErrorType errorType, string error) => errorType switch
    {
        ServiceErrorType.NotFound => NotFound(new { message = error }),
        ServiceErrorType.Validation => BadRequest(new { message = error }),
        ServiceErrorType.Conflict => Conflict(new { message = error }),
        ServiceErrorType.Forbidden => Forbid(),
        _ => StatusCode(500, new { message = error })
    };
}
