import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPost, uploadImage } from "../../posts/api";
import { resolveAvatarUrl } from "../../lib/avatar";
import { ImageIcon } from "../../components/icons/ImageIcon";
import { EmojiPicker } from "../../components/EmojiPicker/EmojiPicker";
import "./CreatePostPage.css";

export function CreatePostPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createPost(groupId!, { title, content, imageUrl }),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "posts"] });
      navigate(`/posts/${post.id}`);
    },
    onError: () => setError("Could not create the post. Please try again."),
  });

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch {
      setError("Could not upload the image. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <div className="create-post__card">
      <h1>New post</h1>

      <form className="create-post__form" onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea
          className="create-post__textarea"
          placeholder="What do you want to share?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        {imageUrl && (
          <div className="create-post__image-preview">
            <img src={resolveAvatarUrl(imageUrl)!} alt="Attached" />
            <button type="button" className="btn-secondary" onClick={() => setImageUrl(null)}>
              Remove image
            </button>
          </div>
        )}

        <div className="create-post__toolbar">
          <label className="create-post__attach">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} disabled={isUploading} />
            <ImageIcon />
            {isUploading ? "Uploading..." : imageUrl ? "Change image" : "Attach image"}
          </label>
          <EmojiPicker onSelect={(emoji) => setContent((prev) => prev + emoji)} />
        </div>

        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={mutation.isPending || isUploading}>
          {mutation.isPending ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
}
