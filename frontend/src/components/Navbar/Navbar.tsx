import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./Navbar.css";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        TalkForum
      </Link>

      <div className="navbar__links">
        <Link to="/" className="navbar__link">
          Groups
        </Link>
        <Link to="/groups/new" className="navbar__link">
          Create group
        </Link>
      </div>

      <div className="navbar__user">
        {user?.avatarUrl ? (
          <img className="navbar__avatar" src={user.avatarUrl} alt={user.displayName} />
        ) : (
          <div className="navbar__avatar-placeholder">{user?.displayName?.charAt(0).toUpperCase()}</div>
        )}
        <button className="btn-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
