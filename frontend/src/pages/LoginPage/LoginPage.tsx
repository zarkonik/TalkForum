import { GoogleLogin } from "@react-oauth/google";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./LoginPage.css";

export function LoginPage() {
  const { loginWithGoogle, loginWithPassword, verifyTwoFactor, verifyRecoveryCode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await loginWithPassword(email, password);
      if (result.requiresTwoFactor && result.challengeToken) {
        setChallengeToken(result.challengeToken);
      } else {
        navigate("/");
      }
    } catch {
      setError("Invalid email or password.");
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    if (!challengeToken) return;
    setError(null);
    setIsVerifying(true);
    try {
      if (useRecoveryCode) {
        await verifyRecoveryCode(challengeToken, code.trim());
      } else {
        await verifyTwoFactor(challengeToken, code.replace(/\D/g, ""));
      }
      navigate("/");
    } catch {
      setError(useRecoveryCode ? "Invalid recovery code." : "Invalid authenticator code.");
    } finally {
      setIsVerifying(false);
    }
  }

  if (challengeToken) {
    return (
      <div className="login-page">
        <div className="login-page__card">
          <h1>Enter your code</h1>
          <p className="login-page__subtitle">
            {useRecoveryCode
              ? "Enter one of your saved recovery codes."
              : "Open your authenticator app and enter the 6-digit code."}
          </p>

          <form className="login-page__form" onSubmit={handleVerifyCode}>
            <input
              type="text"
              inputMode={useRecoveryCode ? "text" : "numeric"}
              placeholder={useRecoveryCode ? "xxxxx-xxxxx" : "123456"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              required
            />
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={isVerifying}>
              {isVerifying ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setUseRecoveryCode((v) => !v);
                setCode("");
                setError(null);
              }}
            >
              {useRecoveryCode ? "Use authenticator code instead" : "Use a recovery code instead"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setChallengeToken(null)}>
              Back
            </button>
          </form>
        </div>
      </div>
    );
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
                const result = await loginWithGoogle(credentialResponse.credential);
                if (result.requiresTwoFactor && result.challengeToken) {
                  setChallengeToken(result.challengeToken);
                } else {
                  navigate("/");
                }
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
