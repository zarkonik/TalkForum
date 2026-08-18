import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "../LoginPage/LoginPage.css";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(email, token, newPassword);
      setIsDone(true);
    } catch {
      setError("This reset link is invalid or expired.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!email || !token) {
    return (
      <div className="login-page">
        <div className="login-page__card">
          <h1>Invalid reset link</h1>
          <p className="login-page__subtitle">
            This password reset link is missing required information. Request a new one.
          </p>
          <p className="login-page__footer">
            <Link to="/forgot-password">Request a new link</Link>
          </p>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="login-page">
        <div className="login-page__card">
          <h1>Password reset</h1>
          <p className="login-page__subtitle">Your password has been updated. You can now log in.</p>
          <button type="button" className="btn-primary" onClick={() => navigate("/login")}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-page__card">
        <h1>Choose a new password</h1>
        <p className="login-page__subtitle">Enter a new password for {email}.</p>

        <form className="login-page__form" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            autoFocus
            required
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
