import { useAuth } from "../../auth/AuthContext";
import "./HomePage.css";

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="home-page">
      <div className="home-page__card">
        {user?.avatarUrl ? (
          <img className="home-page__avatar" src={user.avatarUrl} alt={user.displayName} />
        ) : (
          <div className="home-page__avatar-placeholder">
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
        )}
        <h1>Welcome, {user?.displayName}</h1>
        <p className="home-page__email">{user?.email}</p>
        <button className="btn-secondary home-page__logout" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
