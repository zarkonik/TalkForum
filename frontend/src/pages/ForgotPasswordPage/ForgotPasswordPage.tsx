import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "../LoginPage/LoginPage.css";

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__card">
        <h1>Reset your password</h1>

        {isSubmitted ? (
          <p className="login-page__subtitle">
            If that email is registered, we've sent a link to reset your password. Check your inbox.
          </p>
        ) : (
          <>
            <p className="login-page__subtitle">
              Enter your account email and we'll send you a link to reset your password.
            </p>
            <form className="login-page__form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="login-page__footer">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
