import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { CommentForm } from "../../components/CommentForm/CommentForm";
import { CommentThread } from "../../components/CommentThread/CommentThread";
import { createComment, fetchComments, fetchPost } from "../../posts/api";
import { resolveAvatarUrl } from "../../lib/avatar";
import "./PostDetailPage.css";

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const postQuery = useQuery({
    queryKey: ["posts", id],
    queryFn: () => fetchPost(id!),
    enabled: !!id,
  });

  const commentsQuery = useQuery({
    queryKey: ["posts", id, "comments"],
    queryFn: () => fetchComments(id!),
    enabled: !!id,
  });

  const commentMutation = useMutation({
    mutationFn: (input: { content: string; parentCommentId: string | null }) =>
      createComment(id!, input),
    onSuccess: () => {
      setReplyingToId(null);
      queryClient.invalidateQueries({ queryKey: ["posts", id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["posts", id] });
    },
  });

  const post = postQuery.data;
  const comments = commentsQuery.data ?? [];
  const topLevelComments = comments.filter((c) => c.parentCommentId === null);

  if (postQuery.isLoading || !post) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <div className="post-detail__header">
        <h1>{post.title}</h1>
        <div className="post-detail__meta">
          {resolveAvatarUrl(post.authorAvatarUrl) ? (
            <img className="post-detail__avatar" src={resolveAvatarUrl(post.authorAvatarUrl)!} alt={post.authorDisplayName} />
          ) : (
            <div className="post-detail__avatar-placeholder">{post.authorDisplayName.charAt(0).toUpperCase()}</div>
          )}
          <span>{post.authorDisplayName}</span>
        </div>
        <p className="post-detail__content">{post.content}</p>
      </div>

      <div className="post-detail__section">
        <div className="post-detail__section-title">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </div>

        {topLevelComments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            allComments={comments}
            replyingToId={replyingToId}
            onReply={setReplyingToId}
            onSubmitReply={(content, parentCommentId) =>
              commentMutation.mutateAsync({ content, parentCommentId })
            }
          />
        ))}

        <div className="post-detail__comment-form">
          <CommentForm onSubmit={(content) => commentMutation.mutateAsync({ content, parentCommentId: null })} />
        </div>
      </div>
    </div>
  );
}
