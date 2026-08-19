import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { resolveAvatarUrl } from "../../lib/avatar";
import { NotificationBell } from "../NotificationBell/NotificationBell";
import "./Navbar.css";

export function Navbar() {
  const { user, logout } = useAuth();
  const avatarUrl = resolveAvatarUrl(user?.avatarUrl ?? null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar__top">
        <Link to="/" className="navbar__brand" onClick={() => setIsMenuOpen(false)}>
          TalkForum
        </Link>
        <button
          type="button"
          className="navbar__menu-toggle"
          aria-label="Toggle menu"
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            {isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <div className={`navbar__body${isMenuOpen ? " navbar__body--open" : ""}`}>
        <div className="navbar__links">
          <Link to="/" className="navbar__link" onClick={() => setIsMenuOpen(false)}>
            Groups
          </Link>
          <Link to="/discovery" className="navbar__link" onClick={() => setIsMenuOpen(false)}>
            Discover
          </Link>
          <Link to="/groups/new" className="navbar__link" onClick={() => setIsMenuOpen(false)}>
            Create group
          </Link>
        </div>

        <div className="navbar__user">
          <Link to="/my-groups" className="navbar__link" onClick={() => setIsMenuOpen(false)}>
            My groups
          </Link>
          {user?.isPlatformAdmin && (
            <Link to="/admin" className="navbar__link" onClick={() => setIsMenuOpen(false)}>
              Admin
            </Link>
          )}
          <NotificationBell />
          <Link to="/profile" className="navbar__avatar-link" onClick={() => setIsMenuOpen(false)}>
            {avatarUrl ? (
              <img className="navbar__avatar" src={avatarUrl} alt={user?.displayName} />
            ) : (
              <div className="navbar__avatar-placeholder">{user?.displayName?.charAt(0).toUpperCase()}</div>
            )}
          </Link>
          <button
            className="btn-secondary"
            onClick={() => {
              setIsMenuOpen(false);
              logout();
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
