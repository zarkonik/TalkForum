using Microsoft.EntityFrameworkCore;
using TalkForum.Domain.Entities;
using TalkForum.Infrastructure.Common;
using TalkForum.Infrastructure.Notifications;

namespace TalkForum.Infrastructure.Posts;

public class CommentsService
{
    private readonly AppDbContext _db;
    private readonly PostsService _postsService;
    private readonly NotificationsService _notificationsService;

    public CommentsService(AppDbContext db, PostsService postsService, NotificationsService notificationsService)
    {
        _db = db;
        _postsService = postsService;
        _notificationsService = notificationsService;
    }

    public async Task<ServiceResult<CommentDto>> CreateAsync(Guid userId, Guid postId, CreateCommentRequest request)
    {
        var post = await _db.Posts.FindAsync(postId);
        if (post is null)
        {
            return ServiceResult<CommentDto>.Fail(ServiceErrorType.NotFound, "Post not found.");
        }

        if (!await _postsService.IsApprovedMemberAsync(post.GroupId, userId))
        {
            return ServiceResult<CommentDto>.Fail(ServiceErrorType.Forbidden, "You must be an approved member of this group to comment.");
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return ServiceResult<CommentDto>.Fail(ServiceErrorType.Validation, "Content is required.");
        }

        Comment? parentComment = null;
        if (request.ParentCommentId is not null)
        {
            parentComment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == request.ParentCommentId && c.PostId == postId);
            if (parentComment is null)
            {
                return ServiceResult<CommentDto>.Fail(ServiceErrorType.Validation, "Parent comment not found in this post.");
            }
        }

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            AuthorId = userId,
            ParentCommentId = request.ParentCommentId,
            Content = request.Content.Trim()
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        var author = await _db.Users.FirstAsync(u => u.Id == userId);

        if (parentComment is not null)
        {
            await _notificationsService.NotifyAsync(
                parentComment.AuthorId, userId, NotificationType.CommentReplied, post.GroupId, postId, comment.Id);
        }

        return ServiceResult<CommentDto>.Ok(new CommentDto(
            comment.Id, comment.PostId, comment.ParentCommentId, comment.Content, comment.AuthorId,
            author.DisplayName, author.AvatarUrl, comment.CreatedAt, comment.UpdatedAt, 0, false));
    }

    public async Task<ServiceResult<CommentDto>> UpdateAsync(Guid userId, Guid commentId, UpdateCommentRequest request)
    {
        var comment = await _db.Comments.Include(c => c.Author).FirstOrDefaultAsync(c => c.Id == commentId);
        if (comment is null)
        {
            return ServiceResult<CommentDto>.Fail(ServiceErrorType.NotFound, "Comment not found.");
        }

        if (comment.AuthorId != userId)
        {
            return ServiceResult<CommentDto>.Fail(ServiceErrorType.Forbidden, "You can only edit your own comments.");
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return ServiceResult<CommentDto>.Fail(ServiceErrorType.Validation, "Content is required.");
        }

        comment.Content = request.Content.Trim();
        comment.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        var likeCount = await _db.CommentLikes.CountAsync(l => l.CommentId == commentId);
        var viewerHasLiked = await _db.CommentLikes.AnyAsync(l => l.CommentId == commentId && l.UserId == userId);

        return ServiceResult<CommentDto>.Ok(new CommentDto(
            comment.Id, comment.PostId, comment.ParentCommentId, comment.Content, comment.AuthorId,
            comment.Author!.DisplayName, comment.Author.AvatarUrl, comment.CreatedAt, comment.UpdatedAt, likeCount, viewerHasLiked));
    }

    public async Task<ServiceResult> DeleteAsync(Guid userId, Guid commentId)
    {
        var comment = await _db.Comments.FindAsync(commentId);
        if (comment is null)
        {
            return ServiceResult.Fail(ServiceErrorType.NotFound, "Comment not found.");
        }

        if (comment.AuthorId != userId)
        {
            return ServiceResult.Fail(ServiceErrorType.Forbidden, "You can only delete your own comments.");
        }

        await DeleteWithRepliesAsync(comment);
        return ServiceResult.Ok();
    }

    public async Task<ServiceResult> AdminDeleteAsync(Guid commentId)
    {
        var comment = await _db.Comments.FindAsync(commentId);
        if (comment is null)
        {
            return ServiceResult.Fail(ServiceErrorType.NotFound, "Comment not found.");
        }

        await DeleteWithRepliesAsync(comment);
        return ServiceResult.Ok();
    }

    private async Task DeleteWithRepliesAsync(Comment comment)
    {
        var postComments = await _db.Comments.Where(c => c.PostId == comment.PostId).ToListAsync();
        var toDelete = new List<Comment> { comment };
        var queue = new Queue<Guid>();
        queue.Enqueue(comment.Id);

        while (queue.Count > 0)
        {
            var currentId = queue.Dequeue();
            foreach (var child in postComments.Where(c => c.ParentCommentId == currentId))
            {
                toDelete.Add(child);
                queue.Enqueue(child.Id);
            }
        }

        _db.Comments.RemoveRange(toDelete);
        await _db.SaveChangesAsync();
    }

    public async Task<ServiceResult<IEnumerable<CommentDto>>> GetByPostAsync(Guid userId, Guid postId)
    {
        var post = await _db.Posts.FindAsync(postId);
        if (post is null)
        {
            return ServiceResult<IEnumerable<CommentDto>>.Fail(ServiceErrorType.NotFound, "Post not found.");
        }

        if (!await _postsService.IsApprovedMemberAsync(post.GroupId, userId))
        {
            return ServiceResult<IEnumerable<CommentDto>>.Fail(ServiceErrorType.Forbidden, "You must be an approved member of this group to view comments.");
        }

        var comments = await _db.Comments
            .Include(c => c.Author)
            .Where(c => c.PostId == postId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto(
                c.Id, c.PostId, c.ParentCommentId, c.Content, c.AuthorId, c.Author!.DisplayName, c.Author.AvatarUrl, c.CreatedAt, c.UpdatedAt,
                c.Likes.Count, c.Likes.Any(l => l.UserId == userId)))
            .ToListAsync();

        return ServiceResult<IEnumerable<CommentDto>>.Ok(comments);
    }

    public async Task<ServiceResult<LikeStatusDto>> ToggleLikeAsync(Guid userId, Guid commentId)
    {
        var comment = await _db.Comments.FindAsync(commentId);
        if (comment is null)
        {
            return ServiceResult<LikeStatusDto>.Fail(ServiceErrorType.NotFound, "Comment not found.");
        }

        var post = await _db.Posts.FindAsync(comment.PostId);
        if (post is null || !await _postsService.IsApprovedMemberAsync(post.GroupId, userId))
        {
            return ServiceResult<LikeStatusDto>.Fail(ServiceErrorType.Forbidden, "You must be an approved member of this group to like comments.");
        }

        var existingLike = await _db.CommentLikes.FirstOrDefaultAsync(l => l.CommentId == commentId && l.UserId == userId);
        bool liked;

        if (existingLike is not null)
        {
            _db.CommentLikes.Remove(existingLike);
            liked = false;
        }
        else
        {
            _db.CommentLikes.Add(new CommentLike { Id = Guid.NewGuid(), CommentId = commentId, UserId = userId });
            liked = true;
        }

        await _db.SaveChangesAsync();
        var likeCount = await _db.CommentLikes.CountAsync(l => l.CommentId == commentId);

        if (liked)
        {
            await _notificationsService.NotifyAsync(
                comment.AuthorId, userId, NotificationType.CommentLiked, post.GroupId, post.Id, commentId);
        }

        return ServiceResult<LikeStatusDto>.Ok(new LikeStatusDto(liked, likeCount));
    }
}
