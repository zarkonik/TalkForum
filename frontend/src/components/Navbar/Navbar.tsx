import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { resolveAvatarUrl } from "../../lib/avatar";
import { NotificationBell } from "../NotificationBell/NotificationBell";
import "./Navbar.css";

export function Navbar() {
  const { user, logout } = useAuth();
  const avatarUrl = resolveAvatarUrl(user?.avatarUrl ?? null);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        TalkForum
      </Link>

      <div className="navbar__links">
        <Link to="/" className="navbar__link">
          Groups
        </Link>
        <Link to="/discovery" className="navbar__link">
          Discover
        </Link>
        <Link to="/groups/new" className="navbar__link">
          Create group
        </Link>
      </div>

      <div className="navbar__user">
        <NotificationBell />
        <Link to="/profile" className="navbar__avatar-link">
          {avatarUrl ? (
            <img className="navbar__avatar" src={avatarUrl} alt={user?.displayName} />
          ) : (
            <div className="navbar__avatar-placeholder">{user?.displayName?.charAt(0).toUpperCase()}</div>
          )}
        </Link>
        <button className="btn-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
