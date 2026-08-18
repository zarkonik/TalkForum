using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalkForum.Api.Auth;
using TalkForum.Infrastructure.Common;
using TalkForum.Infrastructure.Posts;

namespace TalkForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/posts/{postId:guid}/comments")]
public class CommentsController : ControllerBase
{
    private readonly CommentsService _commentsService;

    public CommentsController(CommentsService commentsService)
    {
        _commentsService = commentsService;
    }

    [HttpPost]
    public async Task<ActionResult<CommentDto>> Create(Guid postId, CreateCommentRequest request)
    {
        var result = await _commentsService.CreateAsync(User.GetUserId(), postId, request);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CommentDto>>> GetByPost(Guid postId)
    {
        var result = await _commentsService.GetByPostAsync(User.GetUserId(), postId);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPut("/api/comments/{id:guid}")]
    public async Task<ActionResult<CommentDto>> Update(Guid id, UpdateCommentRequest request)
    {
        var result = await _commentsService.UpdateAsync(User.GetUserId(), id, request);
        return result.Success ? Ok(result.Value) : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpDelete("/api/comments/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _commentsService.DeleteAsync(User.GetUserId(), id);
        return result.Success ? NoContent() : ToErrorResult(result.ErrorType, result.Error!);
    }

    [HttpPost("/api/comments/{id:guid}/like")]
    public async Task<ActionResult<LikeStatusDto>> ToggleLike(Guid id)
    {
        var result = await _commentsService.ToggleLikeAsync(User.GetUserId(), id);
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
