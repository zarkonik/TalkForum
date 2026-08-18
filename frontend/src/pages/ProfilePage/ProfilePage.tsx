import { useMutation } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { resolveAvatarUrl } from "../../lib/avatar";
import { uploadAvatar } from "../../profile/api";
import "./ProfilePage.css";

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updatedUser) => {
      setError(null);
      setUser(updatedUser);
    },
    onError: () => setError("Could not upload the avatar. Please try again."),
  });

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    mutation.mutate(file);
    e.target.value = "";
  }

  const avatarUrl = resolveAvatarUrl(user?.avatarUrl ?? null);

  return (
    <div className="profile-page__card">
      {avatarUrl ? (
        <img className="profile-page__avatar" src={avatarUrl} alt={user?.displayName} />
      ) : (
        <div className="profile-page__avatar-placeholder">{user?.displayName?.charAt(0).toUpperCase()}</div>
      )}

      <h1>{user?.displayName}</h1>
      <p className="profile-page__email">{user?.email}</p>

      <div className="profile-page__upload">
        <input
          className="profile-page__file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={mutation.isPending}
        />
        {mutation.isPending && <p>Uploading...</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  );
}
