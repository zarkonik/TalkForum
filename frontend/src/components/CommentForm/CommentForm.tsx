import { type ChangeEvent, type FormEvent, useState } from "react";
import { uploadImage } from "../../posts/api";
import { resolveAvatarUrl } from "../../lib/avatar";
import { ImageIcon } from "../icons/ImageIcon";
import { EmojiPicker } from "../EmojiPicker/EmojiPicker";
import "./CommentForm.css";

interface CommentFormProps {
  onSubmit: (content: string, imageUrl: string | null) => Promise<unknown>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}

export function CommentForm({ onSubmit, onCancel, placeholder = "Write a comment...", submitLabel = "Comment", autoFocus }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch {
      setError("Could not upload the image.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if ((!content.trim() && !imageUrl) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, imageUrl);
      setContent("");
      setImageUrl(null);
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

      {imageUrl && (
        <div className="comment-form__image-preview">
          <img src={resolveAvatarUrl(imageUrl)!} alt="Attached" />
          <button type="button" className="comment-form__remove-image" onClick={() => setImageUrl(null)}>
            Remove
          </button>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="comment-form__actions">
        <button type="submit" className="btn-primary" disabled={isSubmitting || isUploading}>
          {isSubmitting ? "Posting..." : submitLabel}
        </button>
        <label className="comment-form__attach">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} disabled={isUploading} />
          <ImageIcon />
          {isUploading ? "Uploading..." : imageUrl ? "Change image" : "Attach image"}
        </label>
        <EmojiPicker onSelect={(emoji) => setContent((prev) => prev + emoji)} />
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
