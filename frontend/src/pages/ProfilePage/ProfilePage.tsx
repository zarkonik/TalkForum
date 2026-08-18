import { useMutation } from "@tanstack/react-query";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { resolveAvatarUrl } from "../../lib/avatar";
import { updateDisplayName, uploadAvatar } from "../../profile/api";
import "./ProfilePage.css";

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updatedUser) => {
      setAvatarError(null);
      setUser(updatedUser);
    },
    onError: () => setAvatarError("Could not upload the avatar. Please try again."),
  });

  const nameMutation = useMutation({
    mutationFn: updateDisplayName,
    onSuccess: (updatedUser) => {
      setNameError(null);
      setUser(updatedUser);
      setIsEditingName(false);
    },
    onError: () => setNameError("Could not update the display name. Please try again."),
  });

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    avatarMutation.mutate(file);
    e.target.value = "";
  }

  function startEditingName() {
    setDisplayName(user?.displayName ?? "");
    setNameError(null);
    setIsEditingName(true);
  }

  function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    nameMutation.mutate(displayName);
  }

  const avatarUrl = resolveAvatarUrl(user?.avatarUrl ?? null);

  return (
    <div className="profile-page__card">
      {avatarUrl ? (
        <img className="profile-page__avatar" src={avatarUrl} alt={user?.displayName} />
      ) : (
        <div className="profile-page__avatar-placeholder">{user?.displayName?.charAt(0).toUpperCase()}</div>
      )}

      {isEditingName ? (
        <form className="profile-page__name-form" onSubmit={handleNameSubmit}>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
          />
          <div className="profile-page__name-actions">
            <button type="submit" className="btn-primary" disabled={nameMutation.isPending}>
              {nameMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setIsEditingName(false)}>
              Cancel
            </button>
          </div>
          {nameError && <p className="form-error">{nameError}</p>}
        </form>
      ) : (
        <div className="profile-page__name">
          <h1>{user?.displayName}</h1>
          <button type="button" className="profile-page__edit-name" onClick={startEditingName}>
            Edit
          </button>
        </div>
      )}

      <p className="profile-page__email">{user?.email}</p>

      <div className="profile-page__upload">
        <input
          className="profile-page__file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={avatarMutation.isPending}
        />
        {avatarMutation.isPending && <p>Uploading...</p>}
        {avatarError && <p className="form-error">{avatarError}</p>}
      </div>
    </div>
  );
}
