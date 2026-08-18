using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalkForum.Api.Auth;
using TalkForum.Infrastructure.Common;
using TalkForum.Infrastructure.Posts;

namespace TalkForum.Api.Controllers;

[ApiController]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly PostsService _postsService;

    public PostsController(PostsService postsService)
    {
        _postsService = postsService;
    }

    [HttpPost("api/groups/{groupId:guid}/posts")]
    public async Task<ActionResult<PostSummaryDto>> Create(Guid groupId, CreatePostRequest request)
    {
        var result = await _postsService.CreateAsync(User.GetUserId(), groupId, request);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpGet("api/groups/{groupId:guid}/posts")]
    public async Task<ActionResult<IEnumerable<PostSummaryDto>>> GetByGroup(Guid groupId)
    {
        var result = await _postsService.GetByGroupAsync(User.GetUserId(), groupId);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpGet("api/posts/{id:guid}")]
    public async Task<ActionResult<PostSummaryDto>> GetById(Guid id)
    {
        var result = await _postsService.GetByIdAsync(User.GetUserId(), id);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPut("api/posts/{id:guid}")]
    public async Task<ActionResult<PostSummaryDto>> Update(Guid id, UpdatePostRequest request)
    {
        var result = await _postsService.UpdateAsync(User.GetUserId(), id, request);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpDelete("api/posts/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _postsService.DeleteAsync(User.GetUserId(), id);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPost("api/posts/{id:guid}/like")]
    public async Task<ActionResult<LikeStatusDto>> ToggleLike(Guid id)
    {
        var result = await _postsService.ToggleLikeAsync(User.GetUserId(), id);
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
