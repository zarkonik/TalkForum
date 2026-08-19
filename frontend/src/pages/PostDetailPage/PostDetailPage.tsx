import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { CommentForm } from "../../components/CommentForm/CommentForm";
import { CommentThread } from "../../components/CommentThread/CommentThread";
import { LikeButton } from "../../components/LikeButton/LikeButton";
import { ReportButton } from "../../components/ReportButton/ReportButton";
import { REPORT_TARGET_TYPE } from "../../reports/types";
import {
  createComment,
  deleteComment,
  deletePost,
  fetchComments,
  fetchPost,
  toggleCommentLike,
  togglePostLike,
  updateComment,
  updatePost,
  uploadImage,
} from "../../posts/api";
import { resolveAvatarUrl } from "../../lib/avatar";
import { ImageIcon } from "../../components/icons/ImageIcon";
import "./PostDetailPage.css";

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);

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
    mutationFn: (input: { content: string; imageUrl: string | null; parentCommentId: string | null }) =>
      createComment(id!, input),
    onSuccess: () => {
      setReplyingToId(null);
      queryClient.invalidateQueries({ queryKey: ["posts", id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["posts", id] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content, imageUrl }: { commentId: string; content: string; imageUrl: string | null }) =>
      updateComment(commentId, content, imageUrl),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts", id, "comments"] }),
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => toggleCommentLike(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts", id, "comments"] }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["posts", id] });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: () => updatePost(id!, { title: editTitle, content: editContent, imageUrl: editImageUrl }),
    onSuccess: () => {
      setIsEditingPost(false);
      queryClient.invalidateQueries({ queryKey: ["posts", id] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: () => deletePost(id!),
    onSuccess: () => {
      if (post) navigate(`/groups/${post.groupId}`);
    },
  });

  const likePostMutation = useMutation({
    mutationFn: () => togglePostLike(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts", id] }),
  });

  const post = postQuery.data;
  const comments = commentsQuery.data ?? [];
  const topLevelComments = comments.filter((c) => c.parentCommentId === null);
  const isPostAuthor = !!post && !!user && post.authorId === user.id;

  if (postQuery.isLoading || !post) {
    return <p>Loading...</p>;
  }

  function startEditingPost() {
    setEditTitle(post!.title);
    setEditContent(post!.content);
    setEditImageUrl(post!.imageUrl);
    setIsEditingPost(true);
  }

  async function handleEditImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingEdit(true);
    try {
      const url = await uploadImage(file);
      setEditImageUrl(url);
    } finally {
      setIsUploadingEdit(false);
      e.target.value = "";
    }
  }

  return (
    <div className="page-container">
      <div className="post-detail__header">
        {isEditingPost ? (
          <div className="post-detail__edit-form">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title"
            />
            <textarea
              className="post-detail__edit-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Content"
            />
            {editImageUrl && (
              <div className="create-post__image-preview">
                <img src={resolveAvatarUrl(editImageUrl)!} alt="Attached" />
                <button type="button" className="btn-secondary" onClick={() => setEditImageUrl(null)}>
                  Remove image
                </button>
              </div>
            )}
            <div className="post-detail__edit-actions">
              <button
                type="button"
                className="btn-primary"
                disabled={updatePostMutation.isPending}
                onClick={() => updatePostMutation.mutate()}
              >
                {updatePostMutation.isPending ? "Saving..." : "Save"}
              </button>
              <label className="create-post__attach">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleEditImageChange}
                  disabled={isUploadingEdit}
                />
                <ImageIcon />
                {isUploadingEdit ? "Uploading..." : editImageUrl ? "Change image" : "Attach image"}
              </label>
              <button type="button" className="btn-secondary" onClick={() => setIsEditingPost(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="post-detail__top">
              <h1>{post.title}</h1>
              {isPostAuthor && (
                <div className="post-detail__owner-actions">
                  <button type="button" className="post-detail__link-button" onClick={startEditingPost}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="post-detail__link-button post-detail__link-button--danger"
                    onClick={() => {
                      if (confirm("Delete this post and all its comments?")) {
                        deletePostMutation.mutate();
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="post-detail__meta">
              {resolveAvatarUrl(post.authorAvatarUrl) ? (
                <img className="post-detail__avatar" src={resolveAvatarUrl(post.authorAvatarUrl)!} alt={post.authorDisplayName} />
              ) : (
                <div className="post-detail__avatar-placeholder">{post.authorDisplayName.charAt(0).toUpperCase()}</div>
              )}
              <span>{post.authorDisplayName}</span>
              {post.updatedAt && <span>(edited)</span>}
            </div>
            <p className="post-detail__content">{post.content}</p>
            {post.imageUrl && (
              <img className="post-detail__image" src={resolveAvatarUrl(post.imageUrl)!} alt="Attached" />
            )}
            <div className="post-detail__like">
              <LikeButton
                liked={post.viewerHasLiked}
                count={post.likeCount}
                disabled={likePostMutation.isPending}
                onToggle={() => likePostMutation.mutate()}
              />
              <ReportButton targetType={REPORT_TARGET_TYPE.POST} targetId={post.id} />
            </div>
          </>
        )}
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
            currentUserId={user?.id ?? null}
            replyingToId={replyingToId}
            onReply={setReplyingToId}
            onSubmitReply={(content, imageUrl, parentCommentId) =>
              commentMutation.mutateAsync({ content, imageUrl, parentCommentId })
            }
            onUpdate={(commentId, content, imageUrl) => updateCommentMutation.mutateAsync({ commentId, content, imageUrl })}
            onDelete={(commentId) => {
              if (confirm("Delete this comment and its replies?")) {
                deleteCommentMutation.mutate(commentId);
              }
            }}
            onToggleLike={(commentId) => likeCommentMutation.mutate(commentId)}
          />
        ))}

        <div className="post-detail__comment-form">
          <CommentForm
            onSubmit={(content, imageUrl) => commentMutation.mutateAsync({ content, imageUrl, parentCommentId: null })}
          />
        </div>
      </div>
    </div>
  );
}
