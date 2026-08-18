using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalkForum.Api.Auth;
using TalkForum.Infrastructure.Common;
using TalkForum.Infrastructure.Groups;

namespace TalkForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/groups")]
public class GroupsController : ControllerBase
{
    private readonly GroupsService _groupsService;

    public GroupsController(GroupsService groupsService)
    {
        _groupsService = groupsService;
    }

    [HttpPost]
    public async Task<ActionResult<GroupSummaryDto>> Create(CreateGroupRequest request)
    {
        var result = await _groupsService.CreateAsync(User.GetUserId(), request);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GroupSummaryDto>>> GetAll([FromQuery] Guid? categoryId, [FromQuery] string? search)
    {
        var groups = await _groupsService.GetAllAsync(User.GetUserId(), categoryId, search);
        return Ok(groups);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GroupSummaryDto>> GetById(Guid id)
    {
        var result = await _groupsService.GetByIdAsync(User.GetUserId(), id);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPost("{id:guid}/join")]
    public async Task<IActionResult> RequestToJoin(Guid id)
    {
        var result = await _groupsService.RequestToJoinAsync(User.GetUserId(), id);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpGet("{id:guid}/requests")]
    public async Task<ActionResult<IEnumerable<MembershipRequestDto>>> GetPendingRequests(Guid id)
    {
        var result = await _groupsService.GetPendingRequestsAsync(User.GetUserId(), id);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpGet("{id:guid}/members")]
    public async Task<ActionResult<IEnumerable<GroupMemberDto>>> GetMembers(Guid id)
    {
        var result = await _groupsService.GetMembersAsync(User.GetUserId(), id);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPost("{id:guid}/members/{userId:guid}/kick")]
    public async Task<IActionResult> KickMember(Guid id, Guid userId)
    {
        var result = await _groupsService.KickMemberAsync(User.GetUserId(), id, userId);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPost("{id:guid}/members/{userId:guid}/ban")]
    public async Task<IActionResult> BanMember(Guid id, Guid userId)
    {
        var result = await _groupsService.BanMemberAsync(User.GetUserId(), id, userId);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPost("{id:guid}/requests/{userId:guid}/approve")]
    public async Task<IActionResult> ApproveRequest(Guid id, Guid userId)
    {
        var result = await _groupsService.ApproveRequestAsync(User.GetUserId(), id, userId);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPost("{id:guid}/requests/{userId:guid}/reject")]
    public async Task<IActionResult> RejectRequest(Guid id, Guid userId)
    {
        var result = await _groupsService.RejectRequestAsync(User.GetUserId(), id, userId);
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
