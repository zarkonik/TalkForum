namespace TalkForum.Infrastructure.Posts;

public record CreatePostRequest(string Title, string Content, string? ImageUrl);

public record UpdatePostRequest(string Title, string Content, string? ImageUrl);

public record PostSummaryDto(
    Guid Id,
    Guid GroupId,
    string Title,
    string Content,
    string? ImageUrl,
    Guid AuthorId,
    string AuthorDisplayName,
    string? AuthorAvatarUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    int CommentCount,
    int LikeCount,
    bool ViewerHasLiked);

public record CreateCommentRequest(string Content, Guid? ParentCommentId, string? ImageUrl);

public record UpdateCommentRequest(string Content, string? ImageUrl);

public record CommentDto(
    Guid Id,
    Guid PostId,
    Guid? ParentCommentId,
    string Content,
    string? ImageUrl,
    Guid AuthorId,
    string AuthorDisplayName,
    string? AuthorAvatarUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    int LikeCount,
    bool ViewerHasLiked);

public record LikeStatusDto(bool Liked, int LikeCount);
