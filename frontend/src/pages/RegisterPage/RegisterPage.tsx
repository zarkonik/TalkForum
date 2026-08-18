import axios from "axios";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./RegisterPage.css";

export function RegisterPage() {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    try {
      await register(email, password, displayName);
      setIsRegistered(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setErrors(["Email already in use."]);
      } else if (axios.isAxiosError(err) && Array.isArray(err.response?.data?.errors)) {
        setErrors(err.response.data.errors);
      } else {
        setErrors(["Registration failed. Please try again."]);
      }
    }
  }

  if (isRegistered) {
    return (
      <div className="register-page">
        <div className="register-page__card">
          <h1>Check your email</h1>
          <p className="register-page__subtitle">
            We've sent a verification link to {email}. Click it to activate your account before logging in.
          </p>
          <p className="register-page__footer">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    );
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
          {errors.length > 0 && (
            <div className="form-error">
              <ul className="form-error__list">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
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
