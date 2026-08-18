using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalkForum.Api.Auth;
using TalkForum.Infrastructure.Common;
using TalkForum.Infrastructure.Notifications;

namespace TalkForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly NotificationsService _notificationsService;

    public NotificationsController(NotificationsService notificationsService)
    {
        _notificationsService = notificationsService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetAll()
    {
        var notifications = await _notificationsService.GetForUserAsync(User.GetUserId());
        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountDto>> GetUnreadCount()
    {
        var count = await _notificationsService.GetUnreadCountAsync(User.GetUserId());
        return Ok(new UnreadCountDto(count));
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var result = await _notificationsService.MarkAsReadAsync(User.GetUserId(), id);
        if (result.Success) return NoContent();
        return result.ErrorType == ServiceErrorType.NotFound ? NotFound() : Forbid();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificationsService.MarkAllAsReadAsync(User.GetUserId());
        return NoContent();
    }
}
