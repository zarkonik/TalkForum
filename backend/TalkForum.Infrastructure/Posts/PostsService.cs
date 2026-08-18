using Microsoft.EntityFrameworkCore;
using TalkForum.Domain.Entities;
using TalkForum.Infrastructure.Common;

namespace TalkForum.Infrastructure.Posts;

public class PostsService
{
    private readonly AppDbContext _db;

    public PostsService(AppDbContext db)
    {
        _db = db;
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
            Content = request.Content.Trim()
        };

        _db.Posts.Add(post);
        await _db.SaveChangesAsync();

        var author = await _db.Users.FirstAsync(u => u.Id == userId);

        return ServiceResult<PostSummaryDto>.Ok(new PostSummaryDto(
            post.Id, post.GroupId, post.Title, post.Content, post.AuthorId, author.DisplayName, author.AvatarUrl,
            post.CreatedAt, post.UpdatedAt, 0));
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
                p.Id, p.GroupId, p.Title, p.Content, p.AuthorId, p.Author!.DisplayName, p.Author.AvatarUrl,
                p.CreatedAt, p.UpdatedAt, p.Comments.Count))
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

        return ServiceResult<PostSummaryDto>.Ok(new PostSummaryDto(
            post.Id, post.GroupId, post.Title, post.Content, post.AuthorId, post.Author!.DisplayName, post.Author.AvatarUrl,
            post.CreatedAt, post.UpdatedAt, commentCount));
    }

    internal async Task<bool> IsApprovedMemberAsync(Guid groupId, Guid userId)
    {
        return await _db.GroupMemberships.AnyAsync(m =>
            m.GroupId == groupId && m.UserId == userId && m.Status == MembershipStatus.Approved);
    }
}
