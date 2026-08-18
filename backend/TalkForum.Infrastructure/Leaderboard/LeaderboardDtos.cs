namespace TalkForum.Infrastructure.Leaderboard;

public record LeaderboardEntryDto(
    int Rank,
    Guid UserId,
    string DisplayName,
    string? AvatarUrl,
    int LikeCount);
