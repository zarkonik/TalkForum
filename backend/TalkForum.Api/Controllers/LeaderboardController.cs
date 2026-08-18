using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalkForum.Api.Auth;
using TalkForum.Infrastructure.Common;
using TalkForum.Infrastructure.Leaderboard;

namespace TalkForum.Api.Controllers;

[ApiController]
[Authorize]
public class LeaderboardController : ControllerBase
{
    private readonly LeaderboardService _leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService)
    {
        _leaderboardService = leaderboardService;
    }

    [HttpGet("api/groups/{groupId:guid}/leaderboard")]
    public async Task<ActionResult<IEnumerable<LeaderboardEntryDto>>> GetForGroup(Guid groupId)
    {
        var result = await _leaderboardService.GetTopUsersForGroupAsync(User.GetUserId(), groupId);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
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
