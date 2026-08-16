import { GoogleLogin } from "@react-oauth/google";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./LoginPage.css";

export function LoginPage() {
  const { loginWithGoogle, loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await loginWithPassword(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__card">
        <h1>Welcome back</h1>
        <p className="login-page__subtitle">Log in to continue to TalkForum.</p>

        <div className="login-page__google">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setError(null);
              if (!credentialResponse.credential) return;
              try {
                await loginWithGoogle(credentialResponse.credential);
                navigate("/");
              } catch {
                setError("Google login failed.");
              }
            }}
            onError={() => setError("Google login failed.")}
          />
        </div>

        <div className="login-page__divider">or</div>

        <form className="login-page__form" onSubmit={handleSubmit}>
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
            required
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary">
            Log in
          </button>
        </form>

        <p className="login-page__footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
