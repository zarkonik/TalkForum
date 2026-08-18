import { CommentForm } from "../CommentForm/CommentForm";
import type { Comment } from "../../posts/types";
import { resolveAvatarUrl } from "../../lib/avatar";
import "./CommentThread.css";

interface CommentThreadProps {
  comment: Comment;
  allComments: Comment[];
  replyingToId: string | null;
  onReply: (id: string | null) => void;
  onSubmitReply: (content: string, parentCommentId: string) => Promise<unknown>;
}

function collectReplies(rootId: string, allComments: Comment[]): Comment[] {
  const result: Comment[] = [];
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const candidate of allComments) {
      if (candidate.parentCommentId === currentId) {
        result.push(candidate);
        queue.push(candidate.id);
      }
    }
  }

  return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function CommentThread({ comment, allComments, replyingToId, onReply, onSubmitReply }: CommentThreadProps) {
  const commentsById = new Map(allComments.map((c) => [c.id, c]));
  const replies = collectReplies(comment.id, allComments);

  function renderComment(c: Comment, replyToAuthor: string | null) {
    const avatarUrl = resolveAvatarUrl(c.authorAvatarUrl);
    const isReplying = replyingToId === c.id;

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
            <div className="comment-thread__content">{c.content}</div>
            <button
              type="button"
              className="comment-thread__reply-button"
              onClick={() => onReply(isReplying ? null : c.id)}
            >
              Reply
            </button>

            {isReplying && (
              <div className="comment-thread__reply-form">
                <CommentForm
                  placeholder={`Reply to ${c.authorDisplayName}...`}
                  submitLabel="Reply"
                  autoFocus
                  onCancel={() => onReply(null)}
                  onSubmit={(content) => onSubmitReply(content, c.id)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-thread">
      {renderComment(comment, null)}

      {replies.length > 0 && (
        <div className="comment-thread__replies">
          {replies.map((reply) => renderComment(reply, commentsById.get(reply.parentCommentId!)?.authorDisplayName ?? null))}
        </div>
      )}
    </div>
  );
}
