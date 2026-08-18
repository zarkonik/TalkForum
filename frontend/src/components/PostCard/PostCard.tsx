import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { Post } from "../../posts/types";
import { togglePostLike } from "../../posts/api";
import { resolveAvatarUrl } from "../../lib/avatar";
import { LikeButton } from "../LikeButton/LikeButton";
import "./PostCard.css";

export function PostCard({ post }: { post: Post }) {
  const avatarUrl = resolveAvatarUrl(post.authorAvatarUrl);
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => togglePostLike(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", post.groupId, "posts"] });
    },
  });

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
        <span>·</span>
        <LikeButton
          liked={post.viewerHasLiked}
          count={post.likeCount}
          disabled={likeMutation.isPending}
          onToggle={(e) => {
            e.preventDefault();
            e.stopPropagation();
            likeMutation.mutate();
          }}
        />
      </div>
    </Link>
  );
}
