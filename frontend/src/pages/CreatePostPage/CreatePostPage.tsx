import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPost } from "../../posts/api";
import "./CreatePostPage.css";

export function CreatePostPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createPost(groupId!, { title, content }),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "posts"] });
      navigate(`/posts/${post.id}`);
    },
    onError: () => setError("Could not create the post. Please try again."),
  });

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
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
}
