import { Link } from "react-router-dom";
import Card from "../../components/common/Card";

export default function HomePage() {
  return (
    <>
      <section className="event-hero">
        <div className="event-hero__inner">
          <div>
            <p className="page-kicker">Ticket Rush</p>
            <h1>Book event seats with clear status and fast checkout.</h1>
            <p>
              Browse public events, inspect details and pricing, then continue to protected seat selection when tickets are selling.
            </p>
          </div>
          <Card>
            <h3>Start with the event catalog</h3>
            <p>Phase 10 connects the public browsing flow to the live backend event APIs.</p>
            <Link className="btn btn--primary" to="/events">
              Browse events
            </Link>
          </Card>
        </div>
      </section>
    </>
  );
}
