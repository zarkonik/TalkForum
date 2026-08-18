using Microsoft.EntityFrameworkCore;
using TalkForum.Domain.Entities;
using TalkForum.Infrastructure.Common;

namespace TalkForum.Infrastructure.Posts;

public class CommentsService
{
    private readonly AppDbContext _db;
    private readonly PostsService _postsService;

    public CommentsService(AppDbContext db, PostsService postsService)
    {
        _db = db;
        _postsService = postsService;
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

        if (request.ParentCommentId is not null)
        {
            var parentExists = await _db.Comments.AnyAsync(c => c.Id == request.ParentCommentId && c.PostId == postId);
            if (!parentExists)
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

        return ServiceResult<CommentDto>.Ok(new CommentDto(
            comment.Id, comment.PostId, comment.ParentCommentId, comment.Content, comment.AuthorId,
            author.DisplayName, author.AvatarUrl, comment.CreatedAt));
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
                c.Id, c.PostId, c.ParentCommentId, c.Content, c.AuthorId, c.Author!.DisplayName, c.Author.AvatarUrl, c.CreatedAt))
            .ToListAsync();

        return ServiceResult<IEnumerable<CommentDto>>.Ok(comments);
    }
}
