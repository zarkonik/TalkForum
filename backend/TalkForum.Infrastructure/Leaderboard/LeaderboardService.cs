using Microsoft.EntityFrameworkCore;
using TalkForum.Domain.Entities;
using TalkForum.Infrastructure.Common;

namespace TalkForum.Infrastructure.Leaderboard;

public class LeaderboardService
{
    private readonly AppDbContext _db;

    public LeaderboardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ServiceResult<IEnumerable<LeaderboardEntryDto>>> GetTopUsersForGroupAsync(Guid requestingUserId, Guid groupId, int take = 100)
    {
        var isModeratorOrOwner = await _db.GroupMemberships.AnyAsync(m =>
            m.GroupId == groupId && m.UserId == requestingUserId && m.Status == MembershipStatus.Approved
            && (m.Role == GroupRole.Owner || m.Role == GroupRole.Moderator));

        if (!isModeratorOrOwner)
        {
            return ServiceResult<IEnumerable<LeaderboardEntryDto>>.Fail(ServiceErrorType.Forbidden, "Not authorized.");
        }

        var postLikeCounts = await _db.PostLikes
            .Where(l => l.Post!.GroupId == groupId)
            .GroupBy(l => l.Post!.AuthorId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToListAsync();

        var commentLikeCounts = await _db.CommentLikes
            .Where(l => l.Comment!.Post!.GroupId == groupId)
            .GroupBy(l => l.Comment!.AuthorId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToListAsync();

        var totals = new Dictionary<Guid, int>();
        foreach (var entry in postLikeCounts)
        {
            totals[entry.UserId] = totals.GetValueOrDefault(entry.UserId) + entry.Count;
        }
        foreach (var entry in commentLikeCounts)
        {
            totals[entry.UserId] = totals.GetValueOrDefault(entry.UserId) + entry.Count;
        }

        var userIds = totals.Keys.ToList();
        var users = await _db.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.DisplayName, u.AvatarUrl })
            .ToListAsync();
        var usersById = users.ToDictionary(u => u.Id);

        var entries = totals
            .Where(kv => usersById.ContainsKey(kv.Key) && kv.Value > 0)
            .OrderByDescending(kv => kv.Value)
            .Take(take)
            .Select((kv, index) =>
            {
                var user = usersById[kv.Key];
                return new LeaderboardEntryDto(index + 1, user.Id, user.DisplayName, user.AvatarUrl, kv.Value);
            });

        return ServiceResult<IEnumerable<LeaderboardEntryDto>>.Ok(entries);
    }
}
