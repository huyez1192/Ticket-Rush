import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <>
      <section className="event-hero home-hero">
        <div className="event-hero__inner home-hero__inner">
          <div className="event-hero__copy home-hero__copy">
            <h1>Your gateway to <span className="event-hero__headline-accent">unforgettable</span> shows</h1>
            <p className="event-hero__lede">
              Explore a curated world of entertainment and find the events that speak to your soul.
            </p>
            <Link className="btn btn--primary home-hero__cta" to="/events">
              Browse events
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
