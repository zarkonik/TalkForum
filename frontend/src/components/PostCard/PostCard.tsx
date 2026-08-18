import { Link } from "react-router-dom";
import type { Post } from "../../posts/types";
import { resolveAvatarUrl } from "../../lib/avatar";
import "./PostCard.css";

export function PostCard({ post }: { post: Post }) {
  const avatarUrl = resolveAvatarUrl(post.authorAvatarUrl);

  return (
    <Link to={`/posts/${post.id}`} className="post-card">
      <h3 className="post-card__title">{post.title}</h3>
      <p className="post-card__content">{post.content}</p>
      <div className="post-card__meta">
        {avatarUrl ? (
          <img className="post-card__avatar" src={avatarUrl} alt={post.authorDisplayName} />
        ) : (
          <div className="post-card__avatar-placeholder">{post.authorDisplayName.charAt(0).toUpperCase()}</div>
        )}
        <span>{post.authorDisplayName}</span>
        <span>·</span>
        <span>{post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}</span>
      </div>
    </Link>
  );
}
