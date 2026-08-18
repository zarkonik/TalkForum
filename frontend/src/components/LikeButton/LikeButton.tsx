import "./LikeButton.css";

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onToggle: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export function LikeButton({ liked, count, onToggle, disabled }: LikeButtonProps) {
  return (
    <button
      type="button"
      className={`like-button${liked ? " like-button--liked" : ""}`}
      onClick={onToggle}
      disabled={disabled}
    >
      <svg className="like-button__icon" viewBox="0 0 24 24">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
      {count}
    </button>
  );
}
