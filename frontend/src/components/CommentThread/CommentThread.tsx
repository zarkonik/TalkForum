import { type ChangeEvent, useState } from "react";
import { CommentForm } from "../CommentForm/CommentForm";
import { LikeButton } from "../LikeButton/LikeButton";
import { ReportButton } from "../ReportButton/ReportButton";
import type { Comment } from "../../posts/types";
import { resolveAvatarUrl } from "../../lib/avatar";
import { uploadImage } from "../../posts/api";
import { ImageIcon } from "../icons/ImageIcon";
import { EmojiPicker } from "../EmojiPicker/EmojiPicker";
import { REPORT_TARGET_TYPE } from "../../reports/types";
import "./CommentThread.css";

interface CommentThreadProps {
  comment: Comment;
  allComments: Comment[];
  currentUserId: string | null;
  replyingToId: string | null;
  onReply: (id: string | null) => void;
  onSubmitReply: (content: string, imageUrl: string | null, parentCommentId: string) => Promise<unknown>;
  onUpdate: (commentId: string, content: string, imageUrl: string | null) => Promise<unknown>;
  onDelete: (commentId: string) => void;
  onToggleLike: (commentId: string) => void;
}

const MAX_INDENT_DEPTH = 5;

export function CommentThread({
  comment,
  allComments,
  currentUserId,
  replyingToId,
  onReply,
  onSubmitReply,
  onUpdate,
  onDelete,
  onToggleLike,
}: CommentThreadProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);

  function startEditing(c: Comment) {
    setEditingId(c.id);
    setEditContent(c.content);
    setEditImageUrl(c.imageUrl);
    onReply(null);
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

  async function saveEdit(commentId: string) {
    if (!editContent.trim() && !editImageUrl) return;
    setIsSavingEdit(true);
    try {
      await onUpdate(commentId, editContent, editImageUrl);
      setEditingId(null);
    } finally {
      setIsSavingEdit(false);
    }
  }

  function renderComment(c: Comment, depth: number) {
    const avatarUrl = resolveAvatarUrl(c.authorAvatarUrl);
    const isReplying = replyingToId === c.id;
    const isEditing = editingId === c.id;
    const isAuthor = currentUserId !== null && currentUserId === c.authorId;
    const children = allComments
      .filter((x) => x.parentCommentId === c.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const replyToAuthor = c.parentCommentId
      ? allComments.find((x) => x.id === c.parentCommentId)?.authorDisplayName ?? null
      : null;

    return (
      <div className="comment-thread__item" key={c.id}>
        <div className="comment-thread__row">
          {avatarUrl ? (
            <img className="comment-thread__avatar" src={avatarUrl} alt={c.authorDisplayName} />
          ) : (
            <div className="comment-thread__avatar-placeholder">{c.authorDisplayName.charAt(0).toUpperCase()}</div>
          )}
          <div className="comment-thread__body">
            {replyToAuthor && <div className="comment-thread__reply-to">Reply to {replyToAuthor}</div>}
            <div className="comment-thread__author">{c.authorDisplayName}</div>

            {isEditing ? (
              <div className="comment-thread__edit-form">
                <textarea
                  className="comment-thread__edit-textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  autoFocus
                />
                {editImageUrl && (
                  <div className="comment-form__image-preview">
                    <img src={resolveAvatarUrl(editImageUrl)!} alt="Attached" />
                    <button type="button" className="comment-form__remove-image" onClick={() => setEditImageUrl(null)}>
                      Remove
                    </button>
                  </div>
                )}
                <div className="comment-thread__edit-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isSavingEdit}
                    onClick={() => saveEdit(c.id)}
                  >
                    {isSavingEdit ? "Saving..." : "Save"}
                  </button>
                  <label className="comment-form__attach">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleEditImageChange}
                      disabled={isUploadingEdit}
                    />
                    <ImageIcon />
                    {isUploadingEdit ? "Uploading..." : editImageUrl ? "Change image" : "Attach image"}
                  </label>
                  <EmojiPicker onSelect={(emoji) => setEditContent((prev) => prev + emoji)} />
                  <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="comment-thread__content">
                  {c.content}
                  {c.updatedAt && <span className="comment-thread__edited"> (edited)</span>}
                </div>
                {c.imageUrl && (
                  <img className="comment-thread__image" src={resolveAvatarUrl(c.imageUrl)!} alt="Attached" />
                )}
                <div className="comment-thread__actions">
                  <LikeButton
                    liked={c.viewerHasLiked}
                    count={c.likeCount}
                    onToggle={() => onToggleLike(c.id)}
                  />
                  <button type="button" className="comment-thread__reply-button" onClick={() => onReply(isReplying ? null : c.id)}>
                    Reply
                  </button>
                  <ReportButton targetType={REPORT_TARGET_TYPE.COMMENT} targetId={c.id} />
                  {isAuthor && (
                    <>
                      <button type="button" className="comment-thread__reply-button" onClick={() => startEditing(c)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="comment-thread__reply-button comment-thread__reply-button--danger"
                        onClick={() => onDelete(c.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {isReplying && (
              <div className="comment-thread__reply-form">
                <CommentForm
                  placeholder={`Reply to ${c.authorDisplayName}...`}
                  submitLabel="Reply"
                  autoFocus
                  onCancel={() => onReply(null)}
                  onSubmit={(content, imageUrl) => onSubmitReply(content, imageUrl, c.id)}
                />
              </div>
            )}

            {children.length > 0 && (
              <div className={depth < MAX_INDENT_DEPTH ? "comment-thread__children" : "comment-thread__children comment-thread__children--flat"}>
                {children.map((child) => renderComment(child, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div className="comment-thread">{renderComment(comment, 0)}</div>;
}
