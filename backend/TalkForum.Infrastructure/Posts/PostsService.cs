using Microsoft.EntityFrameworkCore;
using TalkForum.Domain.Entities;
using TalkForum.Infrastructure.Common;
using TalkForum.Infrastructure.Notifications;

namespace TalkForum.Infrastructure.Posts;

public class PostsService
{
    private readonly AppDbContext _db;
    private readonly NotificationsService _notificationsService;

    public PostsService(AppDbContext db, NotificationsService notificationsService)
    {
        _db = db;
        _notificationsService = notificationsService;
    }

    public async Task<ServiceResult<PostSummaryDto>> CreateAsync(Guid userId, Guid groupId, CreatePostRequest request)
    {
        if (!await _db.Groups.AnyAsync(g => g.Id == groupId))
        {
            return ServiceResult<PostSummaryDto>.Fail(ServiceErrorType.NotFound, "Group not found.");
        }

        if (!await IsApprovedMemberAsync(groupId, userId))
        {
            return ServiceResult<PostSummaryDto>.Fail(ServiceErrorType.Forbidden, "You must be an approved member of this group to post.");
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return ServiceResult<PostSummaryDto>.Fail(ServiceErrorType.Validation, "Title is required.");
        }

        var post = new Post
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            AuthorId = userId,
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            ImageUrl = request.ImageUrl
        };

        _db.Posts.Add(post);
        await _db.SaveChangesAsync();

        var author = await _db.Users.FirstAsync(u => u.Id == userId);

        var ownerUserId = await _db.GroupMemberships
            .Where(m => m.GroupId == groupId && m.Role == GroupRole.Owner && m.Status == MembershipStatus.Approved)
            .Select(m => (Guid?)m.UserId)
            .FirstOrDefaultAsync();

        if (ownerUserId is not null)
        {
            await _notificationsService.NotifyAsync(ownerUserId.Value, userId, NotificationType.PostCreatedInGroup, groupId, post.Id);
        }

        return ServiceResult<PostSummaryDto>.Ok(new PostSummaryDto(
            post.Id, post.GroupId, post.Title, post.Content, post.ImageUrl, post.AuthorId, author.DisplayName, author.AvatarUrl,
            post.CreatedAt, post.UpdatedAt, 0, 0, false));
    }

    public async Task<ServiceResult<IEnumerable<PostSummaryDto>>> GetByGroupAsync(Guid userId, Guid groupId)
    {
        if (!await _db.Groups.AnyAsync(g => g.Id == groupId))
        {
            return ServiceResult<IEnumerable<PostSummaryDto>>.Fail(ServiceErrorType.NotFound, "Group not found.");
        }

        if (!await IsApprovedMemberAsync(groupId, userId))
        {
            return ServiceResult<IEnumerable<PostSummaryDto>>.Fail(ServiceErrorType.Forbidden, "You must be an approved member of this group to view its posts.");
        }

        var posts = await _db.Posts
            .Include(p => p.Author)
            .Where(p => p.GroupId == groupId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PostSummaryDto(
                p.Id, p.GroupId, p.Title, p.Content, p.ImageUrl, p.AuthorId, p.Author!.DisplayName, p.Author.AvatarUrl,
                p.CreatedAt, p.UpdatedAt, p.Comments.Count, p.Likes.Count, p.Likes.Any(l => l.UserId == userId)))
            .ToListAsync();

        return ServiceResult<IEnumerable<PostSummaryDto>>.Ok(posts);
    }

    public async Task<ServiceResult<PostSummaryDto>> GetByIdAsync(Guid userId, Guid postId)
    {
        var post = await _db.Posts.Include(p => p.Author).FirstOrDefaultAsync(p => p.Id == postId);
        if (post is null)
        {
            return ServiceResult<PostSummaryDto>.Fail(ServiceErrorType.NotFound, "Post not found.");
        }

        if (!await IsApprovedMemberAsync(post.GroupId, userId))
        {
            return ServiceResult<PostSummaryDto>.Fail(ServiceErrorType.Forbidden, "You must be an approved member of this group to view this post.");
        }

        var commentCount = await _db.Comments.CountAsync(c => c.PostId == postId);
        var likeCount = await _db.PostLikes.CountAsync(l => l.PostId == postId);
        var viewerHasLiked = await _db.PostLikes.AnyAsync(l => l.PostId == postId && l.UserId == userId);

        return ServiceResult<PostSummaryDto>.Ok(new PostSummaryDto(
            post.Id, post.GroupId, post.Title, post.Content, post.ImageUrl, post.AuthorId, post.Author!.DisplayName, post.Author.AvatarUrl,
            post.CreatedAt, post.UpdatedAt, commentCount, likeCount, viewerHasLiked));
    }

    public async Task<ServiceResult<PostSummaryDto>> UpdateAsync(Guid userId, Guid postId, UpdatePostRequest request)
    {
        var post = await _db.Posts.Include(p => p.Author).FirstOrDefaultAsync(p => p.Id == postId);
        if (post is null)
        {
            return ServiceResult<PostSummaryDto>.Fail(ServiceErrorType.NotFound, "Post not found.");
        }

        if (post.AuthorId != userId)
        {
            return ServiceResult<PostSummaryDto>.Fail(ServiceErrorType.Forbidden, "You can only edit your own posts.");
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return ServiceResult<PostSummaryDto>.Fail(ServiceErrorType.Validation, "Title is required.");
        }

        post.Title = request.Title.Trim();
        post.Content = request.Content.Trim();
        post.ImageUrl = request.ImageUrl;
        post.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        var commentCount = await _db.Comments.CountAsync(c => c.PostId == postId);
        var likeCount = await _db.PostLikes.CountAsync(l => l.PostId == postId);
        var viewerHasLiked = await _db.PostLikes.AnyAsync(l => l.PostId == postId && l.UserId == userId);

        return ServiceResult<PostSummaryDto>.Ok(new PostSummaryDto(
            post.Id, post.GroupId, post.Title, post.Content, post.ImageUrl, post.AuthorId, post.Author!.DisplayName, post.Author.AvatarUrl,
            post.CreatedAt, post.UpdatedAt, commentCount, likeCount, viewerHasLiked));
    }

    public async Task<ServiceResult> DeleteAsync(Guid userId, Guid postId)
    {
        var post = await _db.Posts.FindAsync(postId);
        if (post is null)
        {
            return ServiceResult.Fail(ServiceErrorType.NotFound, "Post not found.");
        }

        if (post.AuthorId != userId)
        {
            return ServiceResult.Fail(ServiceErrorType.Forbidden, "You can only delete your own posts.");
        }

        _db.Posts.Remove(post);
        await _db.SaveChangesAsync();
        return ServiceResult.Ok();
    }

    public async Task<ServiceResult> AdminDeleteAsync(Guid postId)
    {
        var post = await _db.Posts.FindAsync(postId);
        if (post is null)
        {
            return ServiceResult.Fail(ServiceErrorType.NotFound, "Post not found.");
        }

        _db.Posts.Remove(post);
        await _db.SaveChangesAsync();
        return ServiceResult.Ok();
    }

    public async Task<ServiceResult<LikeStatusDto>> ToggleLikeAsync(Guid userId, Guid postId)
    {
        var post = await _db.Posts.FindAsync(postId);
        if (post is null)
        {
            return ServiceResult<LikeStatusDto>.Fail(ServiceErrorType.NotFound, "Post not found.");
        }

        if (!await IsApprovedMemberAsync(post.GroupId, userId))
        {
            return ServiceResult<LikeStatusDto>.Fail(ServiceErrorType.Forbidden, "You must be an approved member of this group to like posts.");
        }

        var existingLike = await _db.PostLikes.FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);
        bool liked;

        if (existingLike is not null)
        {
            _db.PostLikes.Remove(existingLike);
            liked = false;
        }
        else
        {
            _db.PostLikes.Add(new PostLike { Id = Guid.NewGuid(), PostId = postId, UserId = userId });
            liked = true;
        }

        await _db.SaveChangesAsync();
        var likeCount = await _db.PostLikes.CountAsync(l => l.PostId == postId);

        if (liked)
        {
            await _notificationsService.NotifyAsync(post.AuthorId, userId, NotificationType.PostLiked, post.GroupId, postId);
        }

        return ServiceResult<LikeStatusDto>.Ok(new LikeStatusDto(liked, likeCount));
    }

    internal async Task<bool> IsApprovedMemberAsync(Guid groupId, Guid userId)
    {
        return await _db.GroupMemberships.AnyAsync(m =>
            m.GroupId == groupId && m.UserId == userId && m.Status == MembershipStatus.Approved);
    }
}
