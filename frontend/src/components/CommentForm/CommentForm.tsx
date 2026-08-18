import { type FormEvent, useState } from "react";
import "./CommentForm.css";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<unknown>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}

export function CommentForm({ onSubmit, onCancel, placeholder = "Write a comment...", submitLabel = "Comment", autoFocus }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        className="comment-form__textarea"
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus={autoFocus}
      />
      <div className="comment-form__actions">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Posting..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
