import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "../LoginPage/LoginPage.css";

export function VerifyEmailPage() {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    if (!email || !token) {
      setStatus("error");
      return;
    }
    verifyEmail(email, token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [email, token, verifyEmail]);

  return (
    <div className="login-page">
      <div className="login-page__card">
        {status === "verifying" && (
          <>
            <h1>Verifying your email...</h1>
            <p className="login-page__subtitle">This will just take a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <h1>Email verified</h1>
            <p className="login-page__subtitle">Your account is active. You can now log in.</p>
            <Link to="/login" className="btn-primary" style={{ display: "inline-block", textAlign: "center" }}>
              Go to login
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1>Verification failed</h1>
            <p className="login-page__subtitle">
              This verification link is invalid or expired. Try logging in to request a new one.
            </p>
            <Link to="/login" className="btn-primary" style={{ display: "inline-block", textAlign: "center" }}>
              Go to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
