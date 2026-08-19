import { Link } from "react-router-dom";
import "./LandingPage.css";

export function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-page__hero">
        <span className="landing-page__badge">Communities, not just forums</span>
        <h1>
          Where your community <span className="landing-page__highlight">actually</span> shows up.
        </h1>
        <p className="landing-page__subtitle">
          Groups, discussions, and members that keep coming back. TalkForum gives your community a real
          home — no algorithm, no noise, just the conversations that matter.
        </p>
        <Link to="/login" className="landing-page__cta">
          Get Started
        </Link>
        <p className="landing-page__footnote">Free to join. Takes less than a minute.</p>
      </div>

      <div className="landing-page__features">
        <div className="landing-page__feature">
          <div className="landing-page__feature-title">Build your space</div>
          <p>Create a group around what you care about, set the rules, and grow it your way.</p>
        </div>
        <div className="landing-page__feature">
          <div className="landing-page__feature-title">Real discussions</div>
          <p>Posts, replies, and likes that surface the conversations people actually want to have.</p>
        </div>
        <div className="landing-page__feature">
          <div className="landing-page__feature-title">You're in control</div>
          <p>Approve members, moderate with confidence, and keep your community exactly the way you want it.</p>
        </div>
      </div>
    </div>
  );
}
