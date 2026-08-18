import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { fetchGroupLeaderboard } from "../../leaderboard/api";
import { fetchGroup } from "../../groups/api";
import { resolveAvatarUrl } from "../../lib/avatar";
import "./LeaderboardPage.css";

export function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();

  const groupQuery = useQuery({
    queryKey: ["groups", id],
    queryFn: () => fetchGroup(id!),
    enabled: !!id,
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["groups", id, "leaderboard"],
    queryFn: () => fetchGroupLeaderboard(id!),
    enabled: !!id,
  });

  return (
    <div className="page-container">
      <h1>Leaderboard</h1>
      <p className="leaderboard-page__subtitle">
        {groupQuery.data?.name} · Ranked by total likes received on posts and comments.
      </p>

      {!isLoading && entries?.length === 0 && (
        <p className="leaderboard-page__empty">No likes yet. Be the first to earn one.</p>
      )}

      <div className="leaderboard-page__list">
        {entries?.map((entry) => {
          const avatarUrl = resolveAvatarUrl(entry.avatarUrl);
          return (
            <div
              key={entry.userId}
              className={`leaderboard-page__row${entry.rank <= 3 ? " leaderboard-page__row--top" : ""}`}
            >
              <span className="leaderboard-page__rank">#{entry.rank}</span>
              {avatarUrl ? (
                <img className="leaderboard-page__avatar" src={avatarUrl} alt={entry.displayName} />
              ) : (
                <div className="leaderboard-page__avatar-placeholder">
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="leaderboard-page__name">{entry.displayName}</span>
              <span className="leaderboard-page__likes">
                <svg className="leaderboard-page__likes-icon" viewBox="0 0 24 24">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                </svg>
                {entry.likeCount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
