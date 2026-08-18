namespace TalkForum.Infrastructure.Posts;

public record CreatePostRequest(string Title, string Content);

public record UpdatePostRequest(string Title, string Content);

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
    int CommentCount,
    int LikeCount,
    bool ViewerHasLiked);

public record CreateCommentRequest(string Content, Guid? ParentCommentId);

public record UpdateCommentRequest(string Content);

public record CommentDto(
    Guid Id,
    Guid PostId,
    Guid? ParentCommentId,
    string Content,
    Guid AuthorId,
    string AuthorDisplayName,
    string? AuthorAvatarUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    int LikeCount,
    bool ViewerHasLiked);

public record LikeStatusDto(bool Liked, int LikeCount);
