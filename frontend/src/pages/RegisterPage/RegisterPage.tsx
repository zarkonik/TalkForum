import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./RegisterPage.css";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password, displayName);
      navigate("/");
    } catch {
      setError("Registration failed. Email may already be in use.");
    }
  }

  return (
    <div className="register-page">
      <div className="register-page__card">
        <h1>Create your account</h1>
        <p className="register-page__subtitle">Join TalkForum and find your community.</p>

        <form className="register-page__form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary">
            Sign up
          </button>
        </form>

        <p className="register-page__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
