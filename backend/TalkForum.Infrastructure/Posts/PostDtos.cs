namespace TalkForum.Infrastructure.Posts;

public record CreatePostRequest(string Title, string Content);

public record PostSummaryDto(
    Guid Id,
    Guid GroupId,
    string Title,
    string Content,
    Guid AuthorId,
    string AuthorDisplayName,
    string? AuthorAvatarUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    int CommentCount);

public record CreateCommentRequest(string Content, Guid? ParentCommentId);

public record CommentDto(
    Guid Id,
    Guid PostId,
    Guid? ParentCommentId,
    string Content,
    Guid AuthorId,
    string AuthorDisplayName,
    string? AuthorAvatarUrl,
    DateTimeOffset CreatedAt);
